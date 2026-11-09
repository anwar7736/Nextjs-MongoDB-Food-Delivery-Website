import mongoose from "mongoose";
import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import { sanitizeFoodDescription } from "@/app/lib/foodDescription";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid food item." }, { status: 400 });
  }

  await mongoDB_connect();
  const foodRecord = await foodSchema.findById(id).select("name description price image restaurant_id");
  if (!foodRecord) {
    return NextResponse.json({ success: false, message: "Food item not found." }, { status: 404 });
  }
  const food = foodRecord.toObject();
  food.description = sanitizeFoodDescription(food.description);

  const restaurant = await restaurantSchema.findById(food.restaurant_id)
    .select("name phone email city address");
  if (!restaurant) {
    return NextResponse.json({ success: false, message: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { food, restaurant } });
}
