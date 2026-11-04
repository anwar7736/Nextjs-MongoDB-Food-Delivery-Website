import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { NextResponse } from "next/server";
import { verifyAuthSession } from "@/app/lib/session";
import mongoose from "mongoose";

export async function GET(request, { params })
{
    const { id } = await params;
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ success: false, message: "Invalid food item." }, { status: 400 });
    }
    await mongoDB_connect();
    const data = await foodSchema.findOne({ _id: id, restaurant_id: session.id });
    if (!data) {
        return NextResponse.json({ success: false, message: "Food item not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
}

export async function PUT(request, { params })
{
    const { id } = await params;
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ success: false, message: "Invalid food item." }, { status: 400 });
    }

    await mongoDB_connect();
    const payload = await request.json();
    const food = await foodSchema.findOne({ _id: id, restaurant_id: session.id });
    if (!food) {
        return NextResponse.json({ success: false, message: "Food item not found." }, { status: 404 });
    }
    if (typeof payload.name !== "string" ||
        !Number.isFinite(Number(payload.price)) ||
        Number(payload.price) < 0 ||
        typeof payload.image !== "string" ||
        payload.image.trim().length > 600_000) {
        return NextResponse.json({ success: false, message: "Invalid food item details." }, { status: 400 });
    }
    const data = await foodSchema.findOneAndUpdate({ _id: id, restaurant_id: session.id }, {
        $set: {
            name: payload.name.trim(),
            price: Number(payload.price),
            image: payload.image.trim(),
        },
    }, { new: true });

    return NextResponse.json({ success: true, data, message: "Food item updated." });
}

export async function DELETE(request, { params })
{
    const { id } = await params;
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ success: false, message: "Invalid food item." }, { status: 400 });
    }

    await mongoDB_connect();
    const data = await foodSchema.deleteOne({ _id: id, restaurant_id: session.id });
    if (data.deletedCount === 0) {
        return NextResponse.json({ success: false, message: "Food item not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Food item deleted." });
}