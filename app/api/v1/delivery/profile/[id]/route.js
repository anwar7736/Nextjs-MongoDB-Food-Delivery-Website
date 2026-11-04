import { deliverySchema } from "@/app/models/deliveryModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyAuthSession } from "@/app/lib/session";
const { mongoDB_connect } = require("@/app/helpers/helper");

export async function PUT(request, { params }) {
    const { id } = await params;
    let success = false;
    let data = [];
    let message = "";
    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== "delivery" || session.id !== id) {
        return NextResponse.json({ success: false, data, message: "You are not authorized to update this profile." }, { status: 401 });
    }
    await mongoDB_connect();
    const payload = await request.json();
    const fields = {
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
    };
    const update = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => typeof value === "string")
    );
    let user = await deliverySchema.findOne({ phone: fields.phone, _id: { $ne: id } });
    if (user) {
        success = false;
        message = 'Phone number already used.';
    }

    else {
        user = await deliverySchema.findById(id);
        if (!user) {
            success = false;
            message = "User not fond.";
            return NextResponse.json({ success, data, message });
        }
        if (payload.old_password) {
            if (typeof payload.password !== "string" || payload.password.length < 4) {
                return NextResponse.json({ success: false, data, message: "Provide a new password with at least 4 characters." });
            }
            const passwordMatched = await bcrypt.compare(payload.old_password, user.password);
            if (!passwordMatched) {
                success = false;
                message = "Old password is incorrect.";
                return NextResponse.json({ success, data, message });

            }

            update.password = await bcrypt.hash(payload.password, 10);
        }
        else if (payload.password) {
            return NextResponse.json({ success: false, data, message: "Enter your current password before changing it." });
        }

        data = await deliverySchema.updateOne({ _id: id }, { $set: update });
        if (data.matchedCount > 0) {
            success = true;
            message = "Profile updated successfully.";
            data = await deliverySchema.findById(id, {
                password: 0,
                twoFactorSecret: 0,
                twoFactorPendingSecret: 0,
                twoFactorLastUsedStep: 0,
            });

        } else {
            success = false;
            message = "Nothing to updated.";

        }
    }


    return NextResponse.json({ success, data, message });
}