import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export async function GET(request)
{
    const queryParams = request.nextUrl.searchParams;
    const city    = queryParams.get('location');
    const name  = queryParams.get('restaurant');
    const query = {};
    let success = false;
    let data    = [];
    if (city && name) 
    {
        query.$or = [
          { city: { $regex: new RegExp(city, 'i') } },
          { name: { $regex: new RegExp(name, 'i') } }
        ];
    } 
    else if (city) 
    {
        query.city = { $regex: new RegExp(city, 'i') };
    } 
    else if (name) 
    {
        query.name = { $regex: new RegExp(name, 'i') };
    }

    data = await restaurantSchema.find(query);
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}