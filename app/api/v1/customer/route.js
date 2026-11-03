import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request)
{
    await mongoDB_connect();
    const queryParams = request.nextUrl.searchParams;
    const city = (queryParams.get('location') || "").slice(0, 80);
    const name = (queryParams.get('restaurant') || "").slice(0, 80);
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let success = false;
    let data    = [];
    data = await restaurantSchema.find({
        city: { $regex: new RegExp(escapeRegex(city), 'i') },
        name: { $regex: new RegExp(escapeRegex(name), 'i') },
    }).select("name phone email city address").limit(60);
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}