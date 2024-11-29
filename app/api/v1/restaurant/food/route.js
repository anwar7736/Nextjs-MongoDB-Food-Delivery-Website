import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

mongoDB_connect();
export async function GET(request) 
{
    let success = true;
    let restaurantDetails = [];
    let foodItems = [];
    const restaurant_id = request.nextUrl.searchParams.get('restaurant_id');
    restaurantDetails = await restaurantSchema.findOne({_id:restaurant_id});
    foodItems = await foodSchema.find({restaurant_id});
    if(restaurantDetails && foodItems)
    {
        success = true;
    }

    return NextResponse.json({success, restaurantDetails, foodItems});
}

export async function POST(request) 
{
    let success = false;
    let data = [];
    let message = "";
    request = await request.json();
    data = await foodSchema(request);
    data = await data.save();
    if(data)
    {
        success = true;
        message = "New food item added";
    }

    return NextResponse.json({success, data, message});

}