import { connectionStr } from "@/app/lib/db";
import { restaurantSchema } from "@/app/models/restaurantModel";
import mongoose from "mongoose";
import { NextResponse } from "next/server";


export async function GET()
{
    await mongoose.connect(connectionStr);
    const data  = await restaurantSchema.find();
    return NextResponse.json({success: true, data});
}

export async function POST(request)
{
    const payload = await request.json();
    await mongoose.connect(connectionStr);
    return NextResponse.json({success: true, data:payload});
}