import { mongoDB_connect } from "@/app/helpers/helper";
import { foodSchema } from "@/app/models/foodModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { NextResponse } from "next/server";

export async function GET(request) 
{
    let success = true;
    let restaurantDetails = [];
    let foodItems = [];
    // mongoDB_connect();
    const restaurant_id = request.nextUrl.searchParams.get('restaurant_id');
    // restaurantDetails = await restaurantSchema.findOne({_id:restaurant_id});
    // foodItems = await foodSchema.find({restaurant_id});
    // if(restaurantDetails && foodItems)
    // {
    //     success = true;
    // }

    restaurantDetails = {_id:1,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'};
    foodItems = [{_id:1,name:"Test", price:100, description: 'test address', img_path: 'https://plus.unsplash.com/premium_photo-1683619761468-b06992704398?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YnVyZ2VyfGVufDB8fDB8fHww'}];

    return NextResponse.json({success, restaurantDetails, foodItems});
}

export async function POST(request) 
{
    let success = false;
    let data = [];
    let message = "";
    request = await request.json();
    mongoDB_connect();
    data = await foodSchema(request);
    data = await data.save();
    if(data)
    {
        success = true;
        message = "New food item added";
    }

    return NextResponse.json({success, data, message});

}