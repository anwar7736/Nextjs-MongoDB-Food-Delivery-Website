import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { NextResponse } from "next/server";
import { verifyAuthSession } from "@/app/lib/session";

export async function GET(request, content)
{
    await mongoDB_connect();
    let _id = content.params.id;
    let success = false;
    let data = [];
    data = await foodSchema.findOne({_id});
    if(data)
    {
        success = true;
    }
    
    return NextResponse.json({success, data});
}

export async function PUT(request, content)
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }

    await mongoDB_connect();
    let _id = content.params.id;
    let success = false;
    let data = [];
    let message = "";
    const payload = await request.json();
    const food = await foodSchema.findOne({ _id, restaurant_id: session.id });
    if (!food) {
        return NextResponse.json({ success: false, data, message: "Food item not found." }, { status: 404 });
    }
    if (typeof payload.name !== "string" ||
        !Number.isFinite(Number(payload.price)) ||
        Number(payload.price) < 0 ||
        typeof payload.image !== "string") {
        return NextResponse.json({ success: false, data, message: "Invalid food item details." }, { status: 400 });
    }
    data = await foodSchema.findOneAndUpdate({ _id, restaurant_id: session.id }, {
        $set: {
            name: payload.name.trim(),
            price: Number(payload.price),
            image: payload.image.trim(),
        },
    });
    if (data)
    {
        data = await foodSchema.findOne({_id});
        success = true;
        message = "Food item updated";
    }
    
    return NextResponse.json({success, data, message});
}

export async function DELETE(request, content)
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }

    await mongoDB_connect();
    let _id = content.params.id;
    let success = false;
    let data = [];
    let message = "";
    data = await foodSchema.deleteOne({ _id, restaurant_id: session.id });
    if(data.deletedCount > 0)
    {
        success = true;
        message = "Food item deleted";
    }
    
    return NextResponse.json({success, message});
}