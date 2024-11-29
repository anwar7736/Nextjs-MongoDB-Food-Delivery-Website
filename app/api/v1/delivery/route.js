import { mongoDB_connect } from "@/app/helpers/helper";
import { deliverySchema } from "@/app/models/deliveryModel";
import { NextResponse } from "next/server";

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
            let res = await new deliverySchema(payload);
            res = await res.save();
            message = 'Registration Successfully';
            data = res;
            success = true;
        }
    }

    return NextResponse.json({success, message, data});
}