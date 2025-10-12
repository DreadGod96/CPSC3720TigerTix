import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors"
import { openDatabase } from "./setup.js";

// Define constants
const APP = express();
const PORT = 5001;

// Setup middleware
APP.use(cors());
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Setup routes
APP.use("/api/events", adminRoutes);

// Setup error handling for routes that do not exist
APP.use((req, res, next) => {
    const error = new Error('Route Not Found');
    error.statusCode = 404;
    next(error);
});

// Setup error handling for requests
APP.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'An unexpected error occurred.'
    });
});

// Attempt to create database if it does not exist
openDatabase()

    // If database is created / verified to exist, continue
    .then(() => {
        console.log('Database is ready.');
        APP.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Test Event List: http://localhost:${PORT}/api/events`);
        });
    })

    // Database failed to create, exit
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });