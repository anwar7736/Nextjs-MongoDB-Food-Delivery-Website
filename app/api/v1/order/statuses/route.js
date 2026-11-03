import { mongoDB_connect } from "@/app/helpers/helper";
import { orderStatusSchema } from "@/app/models/orderStatusModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request)
{
    await mongoDB_connect();
    let success = false;
    let data = [];
    data = await orderStatusSchema.find();
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}