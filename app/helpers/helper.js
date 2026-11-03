import mongoose from "mongoose"
import { connectionStr } from "../lib/db"
import { getCookie, hasCookie } from "cookies-next";

let connectionPromise;

export const mongoDB_connect = () => {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose);
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(connectionStr, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }

    return connectionPromise;
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