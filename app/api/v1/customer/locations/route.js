import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import { Result } from "postcss";

mongoDB_connect();
export async function GET()
{
    let success = false;
    let data    = [];
        data = await restaurantSchema.distinct('city', {}, { collation: { locale: "en", strength: 2 } } );
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}