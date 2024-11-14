import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export async function GET() 
{
    let success = false;
    let data = [];
    mongoDB_connect();
    data = await foodSchema.find();
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}

export async function POST(request) 
{
    let success = false;
    let data = [];
    let message = "";
    request = await request.json();
    mongoDB_connect();
    data = await foodSchema(request);
    data = await data.save();
    if(data)
    {
        success = true;
        message = "New food item added";
    }

    return NextResponse.json({success, data, message});

}