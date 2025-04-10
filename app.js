const express = require('express');
//const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose'); 
const app = express();
 
 
const globalErrorHandler = require('./middleware/globalErrorHandler')
const connectDB = require('./config/dbConfig')


// env variables
dotenv.config();

// connect to DB
connectDB();

// Middleware
const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:5173",
    
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PATCH", "DELETE"]
}));

app.use(express.json());


/******ROUTES*****/

// USER Routes
app.use('/api/v1/users',require('./routes/UserRoutes'));

//FOODITEM Routes
app.use('/api/v1/foodItems',require('./routes/foodItemRoutes'));

//RSERVARTION Routes
app.use('/api/v1/reservations',require('./routes/reservationRoutes'));

// ORDER Routes
app.use('/api/v1/orders',require('./routes/orderRoutes'));

// CATEGOREY Routes
app.use('/api/v1/categories',require('./routes/categoryRoutes'));

// Locations Routes
app.use('/api/v1/locations',require('./routes/locationRoutes'));

// ANALYTICS Routes
app.use('/api/v1/analytics',require('./routes/analyticsRoutes'));

// DASHBOARD Routes
app.use('/api/v1/dashboard',require('./routes/analyticsRoutes'));





// global error handling
app.use(globalErrorHandler);

// Starting the server
const  port = process.env.PORT;  
app.listen(port, () => {
    console.log(`server is listening on port ${port}`)
});
   
 
// Handle unhandled promise rejections (mongodb fials)   / exiting the process gracefully first close the server then exit application
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log("Unhandled rejection occurred! Shutting down...");
    //app.close(() => { process.exit(1); });
});
 
// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);  
});


 