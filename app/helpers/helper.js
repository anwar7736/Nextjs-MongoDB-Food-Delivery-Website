import mongoose from "mongoose"
import { connectionStr } from "../lib/db"
import { getCookie, hasCookie } from "cookies-next";

export const mongoDB_connect = async () => 
{
    return await mongoose.connect(connectionStr);
}

export const restaurant_auth = () => 
{
    return isRestaurantAuth() ? JSON.parse(getCookie('restaurant_auth')) : '';
}

export const isRestaurantAuth = () => 
{
    return hasCookie('restaurant_auth');
}

export const user_auth = () => 
{
    return isUserAuth() ? JSON.parse(getCookie('user_auth')) : '';
}

export const isUserAuth = () => 
{
    return hasCookie('user_auth');
}

export const delivery_auth = () => 
{
    return isDeliveryAuth() ? JSON.parse(getCookie('delivery_auth')) : '';
}

export const isDeliveryAuth = () => 
{
    return hasCookie('delivery_auth');
}

export const dateFormat = (date) =>
{
    if(date)
    {
        return new Date(date).toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          });
    }
    else return "";
}