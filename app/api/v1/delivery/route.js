import { mongoDB_connect, restaurant_auth } from "@/app/helpers/helper";
import { deliverySchema } from "@/app/models/deliveryModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createLoginChallenge, publicAccount, setAuthSessionCookie } from "@/app/lib/authenticator";
import { verifyAuthSession } from "@/app/lib/session";

export async function POST(request)
{
    await mongoDB_connect();
    let payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    let success = false;
    let data = [];
    let message = "";
    if(payload.login)
    {
        const identifier = typeof payload.identifier === "string"
            ? payload.identifier.trim()
            : typeof payload.phone === "string" ? payload.phone.trim() : "";
        if (!identifier || typeof payload.password !== "string") {
            return NextResponse.json({ success: false, message: "Email or phone and password are required." }, { status: 400 });
        }
        const accountQuery = identifier.includes("@")
            ? { email: identifier.toLowerCase() }
            : { phone: identifier };
        data = await deliverySchema.findOne(accountQuery);
        if(data)
        {
            const passwordMatched = await bcrypt.compare(payload.password, data.password);
            if(passwordMatched)
            {
                if (data.twoFactorEnabled) {
                    return NextResponse.json({
                        success: true,
                        requiresTwoFactor: true,
                        challenge: createLoginChallenge("delivery", data._id),
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
    }
    else{
        if (typeof payload.phone !== "string" || typeof payload.password !== "string" ||
            typeof payload.name !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ success: false, message: "Name, valid email, phone, and password are required.", fieldErrors: {
                ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email: "Provide a valid email address." } : {}),
            } }, { status: 400 });
        }
        const accountFields = {
            name: payload.name,
            phone: payload.phone,
            email,
            city: payload.city,
            address: payload.address,
        };
        const user = await deliverySchema.findOne({
            $or: [{ phone: accountFields.phone }, { email: accountFields.email }],
        });
        if(user)
        {
            const field = user.email === accountFields.email ? "email" : "phone";
            message = field === "email" ? "Email address already used." : "Phone number already used.";
            return NextResponse.json({ success: false, message, fieldErrors: { [field]: message } }, { status: 409 });
        }
        else{
            accountFields.password = await bcrypt.hash(payload.password, 10);
            let res = await new deliverySchema(accountFields);
            res = await res.save();
            message = 'Registration Successfully';
            data = publicAccount(res);
            success = true;
        }
    }

    const response = NextResponse.json({success, message, data});
    if (success) setAuthSessionCookie(response, "delivery", data._id);
    return response;
}

export async function GET(request)
{
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "restaurant") {
        return NextResponse.json({ success: false, message: "Restaurant sign-in is required." }, { status: 401 });
    }
    await mongoDB_connect();
    let success = false;
    let data = [];
    const queryParams = request.nextUrl.searchParams;
    const city    = queryParams.get('city');
    data = await deliverySchema.find({city: { $regex: new RegExp(city, 'i') }}, {
        password: 0,
        twoFactorSecret: 0,
        twoFactorPendingSecret: 0,
        twoFactorLastUsedStep: 0,
        twoFactorFailedAttempts: 0,
        twoFactorLockUntil: 0,
    });
    if(data)
    {
        success = true;
    }

    return NextResponse.json({success, data});
}