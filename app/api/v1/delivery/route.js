import { mongoDB_connect, restaurant_auth } from "@/app/helpers/helper";
import { deliverySchema } from "@/app/models/deliveryModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

mongoDB_connect();
export async function POST(request)
{
    let payload = await request.json();
    let success = false;
    let data = [];
    let message = "";
    if(payload.login)
    {
        delete payload.login;
        let res = await deliverySchema.findOne(payload);
        if(res)
        {
            message = 'Login Successfully';
            data = res;
            success = true;
        }
    }
    else{
        delete payload.login;
        delete payload.cpassword;
        const user = await deliverySchema.findOne({ phone: payload.phone });
        if(user)
        {
            message = 'Account already exists.';
            success = false;
        }
        else{
            payload.password = await bcrypt.hash(payload.password, 10);
            let res = await new deliverySchema(payload);
            res = await res.save();
            message = 'Registration Successfully';
            data = res;
            success = true;
        }
    }

    return NextResponse.json({success, message, data});
}

export async function GET(request)
{
    let success = false;
    let data = [];
    const queryParams = request.nextUrl.searchParams;
    const city    = queryParams.get('city');
    data = await deliverySchema.find({city: { $regex: new RegExp(city, 'i') }});
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}