import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { NextResponse } from "next/server";

mongoDB_connect();
export async function GET(request, content)
{
    let _id = content.params.id;
    let success = false;
    let data = [];
    data = await foodSchema.findOne({_id});
    if(data)
    {
        success = true;
    }
    
    return NextResponse.json({success, data});
}

export async function PUT(request, content)
{
    let _id = content.params.id;
    let success = false;
    let data = [];
    let message = "";
    request = await request.json();
    data = await foodSchema.findOneAndUpdate({_id}, {$set: request});
    if(data)
    {
        data = await foodSchema.findOne({_id});
        success = true;
        message = "Food item updated";
    }
    
    return NextResponse.json({success, data, message});
}

export async function DELETE(request, content)
{
    let _id = content.params.id;
    let success = false;
    let data = [];
    let message = "";
    data = await foodSchema.deleteOne({_id});
    if(data)
    {
        success = true;
        message = "Food item deleted";
    }
    
    return NextResponse.json({success, message});
}