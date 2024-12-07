import mongoose from "mongoose";
import { mongoDB_connect } from "@/app/helpers/helper";
import { orderSchema } from "@/app/models/orderModel";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { NextResponse } from "next/server";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";

mongoDB_connect();
export async function POST(request)
{
    let success = false;
    let message = "";
    request = await request.json();
    const invoiceNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = new Date().toLocaleDateString();
    let restaurant = await restaurantSchema.findById(request.restaurant_id);
    let deliveries = await deliverySchema.find({city:restaurant.city});
    let randomIndex = Math.floor(Math.random() * deliveries.length);
    let delivery_partner_id = request.delivery_partner_id ?? deliveries.length > 0 ? deliveries[randomIndex]._id : null;
    let orderInput = {
        "user_id": request.user_id,
        "restaurant_id": restaurant._id,
        "delivery_partner_id": delivery_partner_id,
        "date": date,
        "invoice_no": invoiceNo,
        "total": request.total,
        "shipping_charge": request.shipping_charge,
        "final_total": (request.total + request.shipping_charge),
        "status_id": request.status_id ?? "674436ad7f3f886666bb47a7", //Admin defined or Pending
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
                    "status_id": request.status_id ?? "674436ad7f3f886666bb47a7", //Admin defined or Pending
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

export async function GET(request)
{
    const queryParams = request.nextUrl.searchParams;
    const type    = queryParams.get('type');
    const id  = new mongoose.Types.ObjectId(queryParams.get('id'));
    let success = false;
    let data    = [];
    let filter_column = type == 'restaurant' ? 'restaurant_id' : (type == 'user' ? 'user_id' : 'delivery_partner_id');

    data = await orderSchema.aggregate([
        {
            $match: {
                [filter_column]: id,
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

      console.log(data.length);
      

    return NextResponse.json({success, data});

}