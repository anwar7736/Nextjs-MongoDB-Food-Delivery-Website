import mongoose from "mongoose";
import { mongoDB_connect } from "@/app/helpers/helper";
import { orderSchema } from "@/app/models/orderModel";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { NextResponse } from "next/server";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";
import { DEFAULT_ORDER_STATUS_ID, orderStatusSchema } from "@/app/models/orderStatusModel";
import { userSchema } from "@/app/models/userModel";
import { foodSchema } from "@/app/models/foodModel";
import { verifyAuthSession } from "@/app/lib/session";
import { randomUUID } from "node:crypto";
import { ORDER_STATUS_SEEDS } from "@/app/lib/orderStatus";

export async function POST(request) {
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (!session || !["user", "restaurant"].includes(session.type)) {
        return NextResponse.json({ success: false, message: "Sign in to place an order." }, { status: 401 });
    }

    try {
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

        const customer = await userSchema.findById(payload.user_id);
        if (!customer) {
            return NextResponse.json({ success: false, message: "Customer not found." }, { status: 404 });
        }

        const groups = new Map();
        const itemIds = new Set();
        for (const item of payload.items) {
            const restaurantId = isRestaurantOrder
                ? session.id
                : item?.restaurant_id || payload.restaurant_id;
            if (!mongoose.isValidObjectId(item?.id) ||
                !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 99 ||
                !mongoose.isValidObjectId(restaurantId) || itemIds.has(String(item.id))) {
                return NextResponse.json({ success: false, message: "Invalid order items." }, { status: 400 });
            }
            itemIds.add(String(item.id));
            const key = String(restaurantId);
            if (!groups.has(key)) groups.set(key, { restaurantId, items: [] });
            groups.get(key).items.push(item);
        }

        const restaurantIds = [...groups.values()].map((group) => group.restaurantId);
        const restaurants = await restaurantSchema.find({ _id: { $in: restaurantIds } });
        if (restaurants.length !== groups.size) {
            return NextResponse.json({ success: false, message: "One or more restaurants could not be found." }, { status: 404 });
        }
        const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));
        const foods = await foodSchema.find({
            _id: { $in: [...itemIds] },
            restaurant_id: { $in: restaurantIds },
        });
        if (foods.length !== payload.items.length) {
            return NextResponse.json({ success: false, message: "One or more items do not belong to the selected restaurant." }, { status: 400 });
        }
        const foodsById = new Map(foods.map((food) => [String(food._id), food]));
        let statusId = isRestaurantOrder && mongoose.isValidObjectId(payload.status_id)
            ? payload.status_id
            : DEFAULT_ORDER_STATUS_ID;
        let status = await orderStatusSchema.findById(statusId);
        if (!status && String(statusId) === DEFAULT_ORDER_STATUS_ID) {
            status = await orderStatusSchema.findOneAndUpdate(
                { _id: DEFAULT_ORDER_STATUS_ID },
                { $setOnInsert: ORDER_STATUS_SEEDS[0] },
                { new: true, upsert: true }
            );
        }
        if (!status) {
            return NextResponse.json({ success: false, message: "Invalid initial order status." }, { status: 400 });
        }
        if (!status || (isRestaurantOrder && !["Pending", "Preparing"].includes(status.name))) {
            return NextResponse.json({ success: false, message: "Invalid initial order status." }, { status: 400 });
        }

        const preparedOrders = [];
        for (const group of groups.values()) {
            const restaurant = restaurantById.get(String(group.restaurantId));
            const orderItems = group.items.map((item) => {
                const food = foodsById.get(String(item.id));
                if (!food || String(food.restaurant_id) !== String(restaurant._id)) return null;
                const price = isRestaurantOrder ? Number(item.price) : Number(food.price);
                if (!Number.isFinite(price) || price < 0) return null;
                return {
                    food_id: food._id,
                    quantity: Number(item.quantity),
                    price,
                    total: price * Number(item.quantity),
                };
            });
            if (orderItems.some((item) => !item)) {
                return NextResponse.json({ success: false, message: "One or more items do not belong to the selected restaurant." }, { status: 400 });
            }

            let deliveryPartnerId = null;
            if (isRestaurantOrder && payload.delivery_partner_id) {
                const partner = await deliverySchema.findOne({
                    _id: payload.delivery_partner_id,
                    city: restaurant.city,
                });
                if (!partner) {
                    return NextResponse.json({ success: false, message: "Invalid delivery partner." }, { status: 400 });
                }
                deliveryPartnerId = partner._id;
            } else {
                const deliveries = await deliverySchema.find({ city: restaurant.city });
                if (deliveries.length > 0) {
                    deliveryPartnerId = deliveries[Math.floor(Math.random() * deliveries.length)]._id;
                }
            }

            const total = orderItems.reduce((sum, item) => sum + item.total, 0);
            const shippingCharge = isRestaurantOrder ? Number(payload.shipping_charge) : 50;
            if (!Number.isFinite(shippingCharge) || shippingCharge < 0) {
                return NextResponse.json({ success: false, message: "Invalid shipping charge." }, { status: 400 });
            }
            preparedOrders.push({
                restaurant,
                deliveryPartnerId,
                orderItems,
                total,
                shippingCharge,
            });
        }

        const checkoutId = randomUUID();
        const checkoutTotal = preparedOrders.reduce(
            (sum, order) => sum + order.total + order.shippingCharge,
            0
        );
        const mongoSession = await mongoose.startSession();
        try {
            await mongoSession.withTransaction(async () => {
                for (const prepared of preparedOrders) {
                    const order = await new orderSchema({
                        user_id: customer._id,
                        restaurant_id: prepared.restaurant._id,
                        delivery_partner_id: prepared.deliveryPartnerId,
                        date: new Date(),
                        invoice_no: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
                        checkout_id: checkoutId,
                        checkout_total: checkoutTotal,
                        checkout_order_count: preparedOrders.length,
                        total: prepared.total,
                        shipping_charge: prepared.shippingCharge,
                        final_total: prepared.total + prepared.shippingCharge,
                        status_id: statusId,
                    }).save({ session: mongoSession });

                    await orderItemSchema.insertMany(
                        prepared.orderItems.map((item) => ({ ...item, order_id: order._id })),
                        { session: mongoSession }
                    );
                    await new orderStatusLogSchema({
                        order_id: order._id,
                        status_id: statusId,
                        date: new Date(),
                    }).save({ session: mongoSession });
                }
            });
        } finally {
            await mongoSession.endSession();
        }

        return NextResponse.json({
            success: true,
            message: `Order placed across ${preparedOrders.length} restaurant${preparedOrders.length === 1 ? "" : "s"}.`,
            summary: {
                checkout_id: checkoutId,
                restaurant_count: preparedOrders.length,
                subtotal: preparedOrders.reduce((sum, order) => sum + order.total, 0),
                shipping_charge: preparedOrders.reduce((sum, order) => sum + order.shippingCharge, 0),
                total: checkoutTotal,
                invoices: preparedOrders.map((order) => ({
                    restaurant: order.restaurant.name,
                    total: order.total + order.shippingCharge,
                })),
            },
        });
    } catch (error) {
        console.error("Order placement failed:", error.message);
        return NextResponse.json({ success: false, message: "Unable to place this order." }, { status: 500 });
    }
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
            $sort: {
                date: -1,
                _id: -1,
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
            _id: 1,
            date:1,
            invoice_no: 1,
          checkout_id: 1,
          checkout_total: 1,
          checkout_order_count: 1,
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
      
      
      success = true;

    return NextResponse.json({success, data});

}