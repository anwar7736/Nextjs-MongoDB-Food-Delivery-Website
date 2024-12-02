import mongoose from "mongoose"
import { connectionStr } from "../lib/db"
import { getCookie, hasCookie } from "cookies-next";

export const mongoDB_connect = async () => 
{
    return await mongoose.connect(connectionStr);
}

export const session = (key, value = "") => 
{
    if(key && value)
    {
        return localStorage.setItem(key, JSON.stringify(value));
    }
    else{
        return localStorage.getItem(key) != null ? JSON.parse(localStorage.getItem(key)) : [];
    }
}

export const session_destroy = (key) => 
{
    if(key)
    {
        return localStorage.removeItem(key);
    }
}



export const restaurant_auth = () => 
{
    return isRestaurantAuth() ? JSON.parse(getCookie('restaurant_auth')) : '';
}

export const isRestaurantAuth = () => 
{
    return hasCookie('restaurant_auth') ? true : false;
}

export const user_auth = () => 
{
    return isUserAuth() ? JSON.parse(getCookie('user_auth')) : '';
}

export const isUserAuth = () => 
{
    return hasCookie('user_auth') ? true : false;
}

export const delivery_auth = () => 
{
    return isDeliveryAuth() ? JSON.parse(getCookie('delivery_auth')) : '';
}

export const isDeliveryAuth = () => 
{
    return hasCookie('delivery_auth') ? true : false;
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