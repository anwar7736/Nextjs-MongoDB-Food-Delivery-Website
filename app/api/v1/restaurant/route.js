import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

mongoDB_connect();
export async function GET()
{
    const data  = await restaurantSchema.find();
    return NextResponse.json({success: true, data});
}

export async function POST(request)
{
    let payload = await request.json();
    let success = false;
    let data = [];
    let message = "";
    if(payload.login)
    {
        delete payload.login;
        data = await restaurantSchema.findOne({email:payload.email});
        if(data)
        {
            const passwordMatched = await bcrypt.compare(payload.password, data.password);
            if(passwordMatched)
            {
                message = 'Login Successfully';
                success = true;
            }
            else{
                message = 'Password did not matched';
            }
        }
        else{
            message = 'User not found';
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
            payload.password = await bcrypt.hash(payload.password, 10);
            let res = await new restaurantSchema(payload);
            res = await res.save();
            message = 'Registration Successfully';
            data = res;
            success = true;
        }
    }

    return NextResponse.json({success, message, data});
}