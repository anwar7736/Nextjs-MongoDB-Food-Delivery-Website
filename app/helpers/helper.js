import mongoose from "mongoose"
import { connectionStr } from "../lib/db"

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
    return session('restaurant_auth');
}

export const isRestaurantAuth = () => 
{
    return localStorage.getItem('restaurant_auth') !== null;
}