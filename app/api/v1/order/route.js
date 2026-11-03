import mongoose from "mongoose";
import { mongoDB_connect } from "@/app/helpers/helper";
import { orderSchema } from "@/app/models/orderModel";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { NextResponse } from "next/server";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";
import { userSchema } from "@/app/models/userModel";
import { foodSchema } from "@/app/models/foodModel";
import { verifyAuthSession } from "@/app/lib/session";

export async function POST(request)
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (!session || !["user", "restaurant"].includes(session.type)) {
        return NextResponse.json({ success: false, message: "Sign in to place an order." }, { status: 401 });
    }

    await mongoDB_connect();
    const payload = await request.json();
    const isRestaurantOrder = session.type === "restaurant";
    if (!Array.isArray(payload.items) || payload.items.length === 0 ||
        !mongoose.isValidObjectId(payload.user_id)) {
        return NextResponse.json({ success: false, message: "Invalid order details." }, { status: 400 });
    }
    if (!isRestaurantOrder && String(payload.user_id) !== session.id) {
        return NextResponse.json({ success: false, message: "You can only place orders for your account." }, { status: 403 });
    }

    const restaurantId = isRestaurantOrder ? session.id : payload.restaurant_id;
    if (!mongoose.isValidObjectId(restaurantId)) {
        return NextResponse.json({ success: false, message: "Invalid restaurant." }, { status: 400 });
    }
    const restaurant = await restaurantSchema.findById(restaurantId);
    const customer = await userSchema.findById(payload.user_id);
    if (!restaurant || !customer) {
        return NextResponse.json({ success: false, message: "Restaurant or customer not found." }, { status: 404 });
    }

    const itemIds = payload.items.map((item) => item?.id);
    if (itemIds.some((id) => !mongoose.isValidObjectId(id)) ||
        payload.items.some((item) => !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1 || Number(item.quantity) > 99)) {
        return NextResponse.json({ success: false, message: "Invalid order items." }, { status: 400 });
    }
    const foods = await foodSchema.find({
        _id: { $in: itemIds },
        restaurant_id: restaurant._id,
    });
    if (foods.length !== itemIds.length) {
        return NextResponse.json({ success: false, message: "One or more items do not belong to this restaurant." }, { status: 400 });
    }
    const foodsById = new Map(foods.map((food) => [String(food._id), food]));
    const orderItems = payload.items.map((item) => {
        const food = foodsById.get(String(item.id));
        const price = isRestaurantOrder ? Number(item.price) : food.price;
        if (!Number.isFinite(price) || price < 0) return null;
        return {
              food_id: food._id,
              quantity: Number(item.quantity),
              price,
              total: price * Number(item.quantity),
        };
    });
    if (orderItems.some((item) => !item)) {
        return NextResponse.json({ success: false, message: "Invalid item price." }, { status: 400 });
    }

    const deliveries = await deliverySchema.find({ city: restaurant.city });
    let deliveryPartnerId = null;
    if (payload.delivery_partner_id) {
        const partner = await deliverySchema.findOne({
              _id: payload.delivery_partner_id,
              city: restaurant.city,
        });
        if (!partner) {
              return NextResponse.json({ success: false, message: "Invalid delivery partner." }, { status: 400 });
        }
        deliveryPartnerId = partner._id;
    } else if (deliveries.length > 0) {
        deliveryPartnerId = deliveries[Math.floor(Math.random() * deliveries.length)]._id;
    }

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    const shippingCharge = isRestaurantOrder ? Number(payload.shipping_charge) : 50;
    if (!Number.isFinite(shippingCharge) || shippingCharge < 0) {
        return NextResponse.json({ success: false, message: "Invalid shipping charge." }, { status: 400 });
    }
    const statusId = isRestaurantOrder && mongoose.isValidObjectId(payload.status_id)
        ? payload.status_id
        : "674436ad7f3f886666bb47a7";
    const order = await new orderSchema({
        user_id: customer._id,
        restaurant_id: restaurant._id,
        delivery_partner_id: deliveryPartnerId,
        date: new Date(),
        invoice_no: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        total,
        shipping_charge: shippingCharge,
        final_total: total + shippingCharge,
        status_id: statusId,
    }).save();

    await orderItemSchema.insertMany(orderItems.map((item) => ({ ...item, order_id: order._id })));
    await new orderStatusLogSchema({
        order_id: order._id,
        status_id: statusId,
        date: new Date(),
    }).save();

    return NextResponse.json({ success: true, message: "Order placed successfully." });
}

export async function GET(request)
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    const queryParams = request.nextUrl.searchParams;
    const type    = queryParams.get('type');
    const id = queryParams.get('id');
    const filterColumns = {
        restaurant: "restaurant_id",
        user: "user_id",
        delivery: "delivery_partner_id",
    };
    if (!session || session.type !== type || session.id !== id || !filterColumns[type] ||
        !mongoose.isValidObjectId(id)) {
        return NextResponse.json({ success: false, message: "You are not authorized to view these orders." }, { status: 401 });
    }

    await mongoDB_connect();
    const objectId = new mongoose.Types.ObjectId(id);
    let success = false;
    let data    = [];

    data = await orderSchema.aggregate([
        {
            $match: {
                  [filterColumns[type]]: objectId,
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

        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user"
          }
        },

        {
          $lookup: {
            from: "delivery_partners",
            localField: "delivery_partner_id",
            foreignField: "_id",
            as: "delivery"
          }
        },

        {
          $lookup: {
            from: "order_statuses",
            localField: "status_id",
            foreignField: "_id",
            as: "status"
          }
        },
        {
          $project: {
            id_: 1,
            date:1,
            invoice_no: 1,
            total: 1,
            shipping_charge: 1,
            final_total: 1,
            restaurant: { name: 1, phone:1, address:1},
            user: { name: 1, phone: 1, address:1 },
            delivery: { name: 1, phone: 1, address:1 },
            status: { name: 1, color: 1 }
          }
        }
      ]);
      
      
      if(data.length > 0)
      {
        success = true;
      }

    return NextResponse.json({success, data});

}