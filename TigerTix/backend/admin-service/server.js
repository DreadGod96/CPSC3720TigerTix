import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors"
import { openDatabase } from "./setup.js";

// Define constants
const app = express();
const port = 5001;

// Setup middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes
app.use("/api/events", adminRoutes);

// Setup error handling for routes that do not exist
app.use((request, res, next) => {
    const error = new Error('Route Not Found');
    error.statusCode = 404;
    next(error);
});

// Setup error handling for requests
app.use((error, request, res, next) => {
    console.error(error.stack);

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'An unexpected error occurred.'
    });
});

// Attempt to create database if it does not exist
openDatabase()

    // If database is created / verified to exist, continue
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Test Event List: http://localhost:${port}/api/events`);
        });
    })

    // Database failed to create, exit
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });