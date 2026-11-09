import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { getDatabaseErrorDetails } from "@/app/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET()
{
    try {
        await mongoDB_connect();
        const data = await restaurantSchema.distinct('city', {}, { collation: { locale: "en", strength: 2 } } );
        return NextResponse.json({success: true, data});
    } catch (error) {
        console.error("Customer locations request failed:", error.message);
        const { message, status } = getDatabaseErrorDetails(error);
        return NextResponse.json({success: false, message, data: []}, {status});
    }
}