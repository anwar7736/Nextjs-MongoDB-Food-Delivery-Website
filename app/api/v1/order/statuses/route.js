import { mongoDB_connect } from "@/app/helpers/helper";
import { DEFAULT_ORDER_STATUS_ID, orderStatusSchema } from "@/app/models/orderStatusModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request)
{
    try {
        await mongoDB_connect();
        let data = await orderStatusSchema.find().sort({ name: 1 });
        if (data.length === 0) {
            const defaultStatus = await orderStatusSchema.findOneAndUpdate(
                { _id: DEFAULT_ORDER_STATUS_ID },
                {
                    $setOnInsert: {
                        name: "Pending",
                        color: "#f59e0b",
                        status: 1,
                    },
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            data = [defaultStatus];
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Order status loading failed:", error);
        return NextResponse.json(
            { success: false, message: "Unable to load order statuses." },
            { status: 500 }
        );
    }
}