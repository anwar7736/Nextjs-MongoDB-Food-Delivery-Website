import mongoose from "mongoose";
import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid food item." }, { status: 400 });
  }

  await mongoDB_connect();
  const food = await foodSchema.findById(id).select("name description price image restaurant_id");
  if (!food) {
    return NextResponse.json({ success: false, message: "Food item not found." }, { status: 404 });
  }

  const restaurant = await restaurantSchema.findById(food.restaurant_id)
    .select("name phone email city address");
  if (!restaurant) {
    return NextResponse.json({ success: false, message: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { food, restaurant } });
}
