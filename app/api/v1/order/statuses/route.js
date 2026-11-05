import { mongoDB_connect } from "@/app/helpers/helper";
import { orderStatusSchema } from "@/app/models/orderStatusModel";
import { ORDER_STATUS_SEEDS } from "@/app/lib/orderStatus";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request)
{
    try {
        await mongoDB_connect();
        await Promise.all(ORDER_STATUS_SEEDS.map((status) =>
            orderStatusSchema.findOneAndUpdate(
                { _id: status._id },
                { $setOnInsert: status },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            )
        ));
        const data = await orderStatusSchema.find().sort({ name: 1 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Order status loading failed:", error);
        return NextResponse.json(
            { success: false, message: "Unable to load order statuses." },
            { status: 500 }
        );
    }
}