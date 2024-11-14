import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";


export async function GET()
{
    mongoDB_connect();
    const data  = await restaurantSchema.find();
    return NextResponse.json({success: true, data});
}

export async function POST(request)
{
    mongoDB_connect();
    let payload = await request.json();
    let success = false;
    let data = [];
    let message = "";
    if(payload.login)
    {
        delete payload.login;
        let res = await restaurantSchema.findOne(payload);
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
        const user = await restaurantSchema.findOne({
            $or: [{ email: payload.email }, { phone: payload.phone }]
        });

        if(user)
        {
            message = 'Restaurant already exists.';
            success = false;
        }
        else{
            let res = await new restaurantSchema(payload);
            res = await res.save();
            message = 'Registration Successfully';
            data = res;
            success = true;
        }
    }

    return NextResponse.json({success, message, data});
}