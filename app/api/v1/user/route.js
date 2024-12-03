import { mongoDB_connect } from "@/app/helpers/helper";
import { userSchema } from "@/app/models/userModel";
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
        let res = await userSchema.findOne(payload);
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
        const user = await userSchema.findOne({ phone: payload.phone });
        if(user)
        {
            message = 'Account already exists.';
            success = false;
        }
        else{
            let res = await new userSchema(payload);
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
    data = await userSchema.find();
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}