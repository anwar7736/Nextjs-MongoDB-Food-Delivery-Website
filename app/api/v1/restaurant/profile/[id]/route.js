import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
const { mongoDB_connect } = require("@/app/helpers/helper");

mongoDB_connect();
export async function PUT(request, content) {
    let id = content.params.id;
    let success = false;
    let data = [];
    let message = "";
    request = await request.json();
    let phoneExistence = await restaurantSchema.findOne({ phone: request.phone, _id: { $ne: id } });
    let emailExistence = await restaurantSchema.findOne({ email: request.email, _id: { $ne: id } });
    if (phoneExistence) {
        success = false;
        message = 'Phone number already used.';
        return NextResponse.json({ success, data, message });
    }
    else if (emailExistence) {
        success = false;
        message = 'Email address already used.';
        return NextResponse.json({ success, data, message });
    }

    else {
        let user = await restaurantSchema.findById(id);
        if(!user)
        {
            success = false;
            message = "User not fond.";
            return NextResponse.json({ success, data, message });
        }
        if (request.old_password) {
            const passwordMatched = await bcrypt.compare(request.old_password, user.password);
            if (!passwordMatched) {
                success = false;
                message = "Old password is incorrect.";
                return NextResponse.json({ success, data, message });

            }

            request.password = await bcrypt.hash(request.password, 10);
        }

        data = await restaurantSchema.updateOne({ _id: id }, { $set: request });
        if (data.modifiedCount > 0) {
            success = true;
            message = "Profile updated successfully.";
            data  = await restaurantSchema.findById(id, {password:0});

        } else {
            success = false;
            message = "Nothing to updated.";

        }
    }


    return NextResponse.json({ success, data, message });
}