const {DB_DATABASE, DB_USERNAME, DB_PASSWORD} = process.env;
export const connectionStr = process.env.MONGODB_URI ||
    `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.wma4ybi.mongodb.net/${DB_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;

export function getDatabaseErrorDetails(error) {
    const code = error?.code || error?.cause?.code;
    const message = error?.message || "";
    const unavailable = ["MongooseServerSelectionError", "MongoServerSelectionError"].includes(error?.name) ||
        ["MongooseServerSelectionError", "MongoServerSelectionError"].includes(error?.cause?.name) ||
        error?.syscall === "querySrv" ||
        ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ESERVFAIL"].includes(code) ||
        /buffering timed out|server selection timed out|querysrv/i.test(message);

    return unavailable
        ? { status: 503, message: "FoodFlow can't reach its database right now. Check MONGODB_URI and the database network connection." }
        : { status: 500, message: "Unable to complete the database request." };
}
