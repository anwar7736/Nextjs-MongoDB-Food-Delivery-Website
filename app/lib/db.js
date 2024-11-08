const {DB_DATABASE, DB_USERNAME, DB_PASSWORD} = process.env;
export const connectionStr = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.3hzyc.mongodb.net/${DB_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`
