import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

mongoDB_connect();
export async function GET(request)
{
    const queryParams = request.nextUrl.searchParams;
    const city    = queryParams.get('location');
    const name  = queryParams.get('restaurant');
    let success = false;
    let data    = [];
    data = await restaurantSchema.find({
        city: { $regex: new RegExp(city, 'i') },
        name: { $regex: new RegExp(name, 'i') },

    });
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}