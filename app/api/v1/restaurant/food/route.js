import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import { verifyAuthSession } from "@/app/lib/session";

export async function GET(request) 
{
    await mongoDB_connect();
    let success = true;
    let restaurantDetails = [];
    let foodItems = [];
    const restaurant_id = request.nextUrl.searchParams.get('restaurant_id');
    restaurantDetails = await restaurantSchema.findOne(
        { _id: restaurant_id },
        { name: 1, phone: 1, email: 1, city: 1, address: 1 }
    );
    foodItems = await foodSchema.find({restaurant_id});
    if(restaurantDetails && foodItems)
    {
        success = true;
    }

    return NextResponse.json({success, restaurantDetails, foodItems});
}

export async function POST(request) 
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }

    await mongoDB_connect();
    let success = false;
    let data = [];
    let message = "";
    const payload = await request.json();
    if (payload.restaurant_id !== session.id ||
        typeof payload.name !== "string" ||
        !Number.isFinite(Number(payload.price)) ||
        Number(payload.price) < 0 ||
        typeof payload.image !== "string") {
        return NextResponse.json({ success: false, message: "Invalid food item details." }, { status: 400 });
    }

    data = await foodSchema({
        name: payload.name.trim(),
        price: Number(payload.price),
        image: payload.image.trim(),
        restaurant_id: session.id,
    });
    data = await data.save();
    if(data)
    {
        success = true;
        message = "New food item added";
    }

    return NextResponse.json({success, data, message});

}