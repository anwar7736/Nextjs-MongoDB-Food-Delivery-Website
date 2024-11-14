import mongoose from "mongoose"
import { connectionStr } from "../lib/db"

export const mongoDB_connect = async () => {
    return await mongoose.connect(connectionStr);
}