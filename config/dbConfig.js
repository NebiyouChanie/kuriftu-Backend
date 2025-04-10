const mongoose = require('mongoose');
require('dotenv').config()


// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.log("MongoDB failed to connect.",error);
        process.exit(1)
    }
}
 
module.exports = connectDB;
 