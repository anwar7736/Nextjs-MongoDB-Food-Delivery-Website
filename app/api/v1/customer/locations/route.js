import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export async function GET()
{
    mongoDB_connect();
    let success = false;
    let data    = [];
        data = await restaurantSchema.distinct('city', {}, { collation: { locale: "en", strength: 2 } } );
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}