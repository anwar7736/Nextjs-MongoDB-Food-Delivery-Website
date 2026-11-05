import { mongoDB_connect } from "@/app/helpers/helper";
import { orderSchema } from "@/app/models/orderModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";
import { verifyAuthSession } from "@/app/lib/session";
import { foodSchema } from "@/app/models/foodModel";
import { userSchema } from "@/app/models/userModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { orderStatusSchema } from "@/app/models/orderStatusModel";
import { canTransitionOrderStatus } from "@/app/lib/orderStatus";

export async function GET(request, { params }) {
  const { _id } = await params;
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  if (!session) {
    return NextResponse.json({ success: false, message: "Sign in to view this order." }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return NextResponse.json({ success: false, message: "Invalid order." }, { status: 400 });
  }
  await mongoDB_connect();
  const orderRecord = await orderSchema.findById(_id);
  const ownsOrder = orderRecord && (
    (session.type === "restaurant" && String(orderRecord.restaurant_id) === session.id) ||
    (session.type === "user" && String(orderRecord.user_id) === session.id) ||
    (session.type === "delivery" && String(orderRecord.delivery_partner_id) === session.id)
  );
  if (!ownsOrder) {
    return NextResponse.json({ success: false, message: "You are not authorized to view this order." }, { status: 403 });
  }

  let success = false;
  let data = [];
  data = await orderSchema.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      }
    },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurant_id",
        foreignField: "_id",
        as: "restaurant"
      }
    },
    { $unwind: "$restaurant" },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "delivery_partners",
        localField: "delivery_partner_id",
        foreignField: "_id",
        as: "delivery"
      }
    },
    { $unwind: { path: "$delivery", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "order_statuses",
        localField: "status_id",
        foreignField: "_id",
        as: "status"
      }
    },
    { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "order_details"
      }
    },
    { $unwind: "$order_details" },
    {
      $lookup: {
        from: "foods",
        localField: "order_details.food_id",
        foreignField: "_id",
        as: "order_details.food"
      }
    },
    { $unwind: { path: "$order_details.food", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        date: { $first: "$date" },
        invoice_no: { $first: "$invoice_no" },
        total: { $first: "$total" },
        shipping_charge: { $first: "$shipping_charge" },
        final_total: { $first: "$final_total" },
        status_id: { $first: "$status_id" },
        restaurant: { $first: "$restaurant" },
        user: { $first: "$user" },
        delivery: { $first: "$delivery" },
        status: { $first: "$status" },
        order_details: {
          $push: {
            id: { $ifNull: ["$order_details.food._id", "$order_details.food_id"] },
            name: { $ifNull: ["$order_details.food.name", "Food item unavailable"] },
            quantity: "$order_details.quantity",
            price: "$order_details.price",
            total: "$order_details.total",
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        date: 1,
        invoice_no: 1,
        total: 1,
        shipping_charge: 1,
        final_total: 1,
        status_id: 1,
        restaurant: { name: 1, phone: 1, address: 1 },
        user: {_id: 1, name: 1, phone: 1, address: 1 },
        delivery: {_id: 1, name: 1, phone: 1, address: 1 },
        status: {_id: 1, name: 1, color: 1 },
        order_details: 1
      }
    }
  ]);

  if (data.length > 0) {
    success = true;
  }

  return NextResponse.json({ success, data });

}

export async function PUT(request, { params }) {
  const { _id } = await params;
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  if (session?.type !== "restaurant") {
    return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return NextResponse.json({ success: false, message: "Invalid order." }, { status: 400 });
  }

  try {
    await mongoDB_connect();
    const payload = await request.json();
    const oldOrder = await orderSchema.findOne({ _id, restaurant_id: session.id });
    if (!oldOrder) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    if (!mongoose.Types.ObjectId.isValid(payload.user_id) ||
        (payload.delivery_partner_id && !mongoose.Types.ObjectId.isValid(payload.delivery_partner_id)) ||
        !Array.isArray(payload.items) || payload.items.length === 0 ||
        !Number.isFinite(Number(payload.shipping_charge)) || Number(payload.shipping_charge) < 0 ||
        payload.items.some((item) => !mongoose.Types.ObjectId.isValid(item.id) ||
          !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 ||
          Number(item.quantity) > 99 || !Number.isFinite(Number(item.price)) || Number(item.price) < 0)) {
      return NextResponse.json({ success: false, message: "Invalid order details." }, { status: 400 });
    }

    const restaurant = await restaurantSchema.findById(session.id);
    const [customer, deliveryPartner, foods] = await Promise.all([
      userSchema.findById(payload.user_id),
      payload.delivery_partner_id
        ? deliverySchema.findOne({ _id: payload.delivery_partner_id, city: restaurant?.city })
        : Promise.resolve(null),
      foodSchema.find({ _id: { $in: payload.items.map((item) => item.id) }, restaurant_id: session.id }),
    ]);
    if (!customer || (payload.delivery_partner_id && !deliveryPartner) || foods.length !== payload.items.length) {
      return NextResponse.json({ success: false, message: "Customer, delivery partner, or food item is invalid." }, { status: 400 });
    }

    const orderItemInput = payload.items.map((item) => ({
      order_id: _id,
      food_id: item.id,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number(item.price) * Number(item.quantity),
    }));
    const total = orderItemInput.reduce((sum, item) => sum + item.total, 0);
    const shippingCharge = Number(payload.shipping_charge);
    const orderInput = {
      user_id: customer._id,
      delivery_partner_id: deliveryPartner?._id ?? null,
      total,
      shipping_charge: shippingCharge,
      final_total: total + shippingCharge,
    };
    const statusChanged = String(oldOrder.status_id) !== String(payload.status_id);
    if (statusChanged) {
      if (!mongoose.Types.ObjectId.isValid(payload.status_id)) {
        return NextResponse.json({ success: false, message: "Select a valid order status." }, { status: 400 });
      }
      const [currentStatus, nextStatus] = await Promise.all([
        orderStatusSchema.findById(oldOrder.status_id),
        orderStatusSchema.findById(payload.status_id),
      ]);
      if (!currentStatus || !nextStatus ||
          !canTransitionOrderStatus("restaurant", currentStatus.name, nextStatus.name)) {
        return NextResponse.json({ success: false, message: "That order status change is not allowed." }, { status: 400 });
      }
      orderInput.status_id = nextStatus._id;
    }

    await orderSchema.updateOne({ _id, restaurant_id: session.id }, { $set: orderInput });
    await orderItemSchema.deleteMany({ order_id: _id });
    await orderItemSchema.insertMany(orderItemInput);
    if (statusChanged && orderInput.status_id) {
      await new orderStatusLogSchema({
        order_id: _id,
        status_id: orderInput.status_id,
        date: new Date(),
      }).save();
    }

    return NextResponse.json({ success: true, message: "Order updated successfully." });
  } catch (error) {
    console.error("Order update failed:", error.message);
    return NextResponse.json({ success: false, message: "Unable to update this order." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { _id } = await params;
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  if (!session || !["restaurant", "delivery"].includes(session.type)) {
    return NextResponse.json({ success: false, message: "Restaurant or delivery partner sign-in is required." }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return NextResponse.json({ success: false, message: "Invalid order." }, { status: 400 });
  }

  try {
    await mongoDB_connect();
    const payload = await request.json();
    if (!mongoose.Types.ObjectId.isValid(payload.status_id)) {
      return NextResponse.json({ success: false, message: "Select a valid order status." }, { status: 400 });
    }

    const ownershipField = session.type === "restaurant" ? "restaurant_id" : "delivery_partner_id";
    const order = await orderSchema.findOne({ _id, [ownershipField]: session.id });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    const [currentStatus, nextStatus] = await Promise.all([
      orderStatusSchema.findById(order.status_id),
      orderStatusSchema.findById(payload.status_id),
    ]);
    if (!currentStatus || !nextStatus ||
        !canTransitionOrderStatus(session.type, currentStatus.name, nextStatus.name)) {
      return NextResponse.json({ success: false, message: "That order status change is not allowed." }, { status: 400 });
    }

    const updated = await orderSchema.updateOne({
      _id,
      [ownershipField]: session.id,
      status_id: order.status_id,
    }, { $set: { status_id: nextStatus._id } });
    if (updated.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "This order status has changed. Refresh and try again." }, { status: 409 });
    }

    await new orderStatusLogSchema({
      order_id: order._id,
      status_id: nextStatus._id,
      date: new Date(),
    }).save();
    return NextResponse.json({
      success: true,
      message: "Order status updated.",
      data: { _id: nextStatus._id, name: nextStatus.name, color: nextStatus.color },
    });
  } catch (error) {
    console.error("Order status update failed:", error.message);
    return NextResponse.json({ success: false, message: "Unable to update this order status." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { _id } = await params;
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  if (session?.type !== "restaurant") {
    return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return NextResponse.json({ success: false, message: "Invalid order." }, { status: 400 });
  }

  await mongoDB_connect();
  const order = await orderSchema.findOne({ _id, restaurant_id: session.id });
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }
  await orderItemSchema.deleteMany({ order_id: _id });
  await orderStatusLogSchema.deleteMany({ order_id: _id });
  await orderSchema.deleteOne({ _id, restaurant_id: session.id });

  return NextResponse.json({ success: true, message: "Order has been deleted." });

}