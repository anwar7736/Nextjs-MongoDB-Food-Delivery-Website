import { mongoDB_connect, user_auth } from "@/app/helpers/helper";
import { deliverySchema } from "@/app/models/deliveryModel";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { orderSchema } from "@/app/models/orderModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

mongoDB_connect();
export async function POST(request)
{
    let success = false;
    let message = "";
    request = await request.json();
    const invoiceNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = new Date().toLocaleDateString();
    let restaurant = await restaurantSchema.findOne({_id:request.restaurant_id});
        restaurant = await restaurant.json();
    let deliveries = await deliverySchema.find({city:restaurant.city});
        deliveries = await deliveries.json();
    let randomIndex = Math.floor(Math.random() * deliveries.length);
    let delivery_partner_id = deliveries ? deliveries[randomIndex]._id : "";
    let orderInput = {
        "user_id": request.user_id,
        "restaurant_id": request.restaurant_id,
        "delivery_partner_id": delivery_partner_id,
        "date": date,
        "invoice_no": invoiceNo,
        "total": request.total,
        "shipping_charge": request.shipping_charge,
        "final_total": (request.total + request.shipping_charge)
    };

    let order = await orderSchema(orderInput);
        order = await order.save();
        if(order)
        {
            let orderItemInput = [];
            request.items.map(item => {
                orderItemInput.push({
                    "order_id": order._id,
                    "food_id": item.id,
                    "quantity": item.quantity,
                    "price": item.price,
                    "total": (item.price * item.quantity)
                });
            });

            let items = await orderItemSchema.insertMany(orderItemInput);
            if(items)
            {
                let statusLogInput = {
                    "order_id": order._id,
                    "status_id": "674436ad7f3f886666bb47a7", //Pending
                    "date": date
                };

                let statusLog = await orderStatusLogSchema(statusLogInput);
                    statusLog = await statusLog.save();
                if(statusLog)
                {
                    success = true;
                    message = "Order placed successfully.";
                }
            }
        }


    return NextResponse.json({success, message});
}