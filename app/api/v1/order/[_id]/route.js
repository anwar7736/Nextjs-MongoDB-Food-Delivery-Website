import { mongoDB_connect } from "@/app/helpers/helper";
import { orderSchema } from "@/app/models/orderModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { orderItemSchema } from "@/app/models/orderItemModel";
mongoDB_connect();
export async function GET(request, { params }) {
  let { _id } = params;
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
    { $unwind: "$delivery" },
    {
      $lookup: {
        from: "order_statuses",
        localField: "status_id",
        foreignField: "_id",
        as: "status"
      }
    },
    { $unwind: "$status" },
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
    { $unwind: "$order_details.food" },
    {
      $group: {
        _id: "$_id",
        date: { $first: "$date" },
        invoice_no: { $first: "$invoice_no" },
        total: { $first: "$total" },
        shipping_charge: { $first: "$shipping_charge" },
        final_total: { $first: "$final_total" },
        restaurant: { $first: "$restaurant" },
        user: { $first: "$user" },
        delivery: { $first: "$delivery" },
        status: { $first: "$status" },
        order_details: {
          $push: {
            name: "$order_details.food.name",
            quantity: "$order_details.quantity",
            price: "$order_details.price",
            total: "$order_details.total",
          }
        }
      }
    },
    {
      $project: {
        id_: 1,
        date: 1,
        invoice_no: 1,
        total: 1,
        shipping_charge: 1,
        final_total: 1,
        restaurant: { name: 1, phone: 1, address: 1 },
        user: { name: 1, phone: 1, address: 1 },
        delivery: { name: 1, phone: 1, address: 1 },
        status: { name: 1, color: 1 },
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
  let { _id } = params;
  let success = false;
  let data = [];
  let message = "";
  try {
    request = await request.json();
    let orderInput = {
      "user_id": request.user_id,
      "delivery_partner_id": request.delivery_partner_id,
      "total": request.total,
      "shipping_charge": request.shipping_charge,
      "final_total": (request.total + request.shipping_charge),
    };
    const order = await orderSchema.findOneAndUpdate({ _id }, { $set: orderInput });
    if (order) {
      const itemDeleted = await orderItemSchema.deleteMany({ order_id: _id });
      let orderItemInput = [];
      request.items.map(item => {
        orderItemInput.push({
          "order_id": _id,
          "food_id": item.id,
          "quantity": item.quantity,
          "price": item.price,
          "total": (item.price * item.quantity)
        });
      });

      let items = await orderItemSchema.insertMany(orderItemInput);
      if (items) {
        success = true;
        message = "Order updated successfully.";
      }
    }
  } catch (error) {
    console.error("Error:", error);
    message = "Error occured while order updated";
  }

  return NextResponse.json({ success, message });
}

export async function DELETE(request, { params }) {
  let { _id } = params;
  let success = false;
  let data = [];
  let message = "";
  const itemDeleted = await orderItemSchema.deleteMany({ order_id: _id });
  if (itemDeleted) {
    data = await orderSchema.deleteOne({ _id });
    if (data) {
      success = true;
      message = "Order has been deleted";
    }
  }

  return NextResponse.json({ success, message });

}