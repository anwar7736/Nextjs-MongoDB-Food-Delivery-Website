import { mongoDB_connect } from "@/app/helpers/helper";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createLoginChallenge, publicAccount, setAuthSessionCookie } from "@/app/lib/authenticator";

export async function GET()
{
    await mongoDB_connect();
    const data  = await restaurantSchema.find({}, {
        password: 0,
        twoFactorSecret: 0,
        twoFactorPendingSecret: 0,
        twoFactorLastUsedStep: 0,
        twoFactorFailedAttempts: 0,
        twoFactorLockUntil: 0,
    });
    return NextResponse.json({success: true, data});
}

export async function POST(request)
{
    await mongoDB_connect();
    let payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }
    let success = false;
    let data = [];
    let message = "";
    if(payload.login)
    {
        if (typeof payload.email !== "string" || typeof payload.password !== "string") {
            return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
        }
        delete payload.login;
        data = await restaurantSchema.findOne({email:payload.email});
        if(data)
        {
            const passwordMatched = await bcrypt.compare(payload.password, data.password);
            if(passwordMatched)
            {
                if (data.twoFactorEnabled) {
                    return NextResponse.json({
                        success: true,
                        requiresTwoFactor: true,
                        challenge: createLoginChallenge("restaurant", data._id),
                        message: "Enter the code from your authenticator app.",
                    });
                }
                message = 'Login Successfully';
                success = true;
                data = publicAccount(data);
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
        if (typeof payload.email !== "string" || typeof payload.phone !== "string" || typeof payload.password !== "string") {
            return NextResponse.json({ success: false, message: "Email, phone, and password are required." }, { status: 400 });
        }
        const accountFields = {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            city: payload.city,
            address: payload.address,
        };
        const user = await restaurantSchema.findOne({
            $or: [{ email: accountFields.email }, { phone: accountFields.phone }]
        });

        if(user)
        {
            message = 'Restaurant already exists.';
            success = false;
        }
        else{
            accountFields.password = await bcrypt.hash(payload.password, 10);
            let res = await new restaurantSchema(accountFields);
            res = await res.save();
            message = 'Registration Successfully';
            data = publicAccount(res);
            success = true;
        }
    }

    const response = NextResponse.json({success, message, data});
    if (success) setAuthSessionCookie(response, "restaurant", data._id);
    return response;
}