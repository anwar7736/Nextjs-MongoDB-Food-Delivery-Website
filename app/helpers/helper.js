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
        return JSON.parse(localStorage.getItem(key));
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
    return JSON.parse(getCookie('restaurant_auth'));
}

export const isRestaurantAuth = () => 
{
    return hasCookie('restaurant_auth') ? true : false;
}