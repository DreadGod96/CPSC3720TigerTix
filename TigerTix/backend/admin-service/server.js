import express from "express";
import sqlite3 from "sqlite3";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors"

const SQLITE3 = sqlite3.verbose(); //verbose for more detailed logging

//Database assumed to be created at this point
//const DATABASE = new SQLITE3.Database('./backend/shared-db/database.sqlite');

const APP = express();
const PORT = 5001;

// Setup middleware
APP.use(cors());
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Example route setup
APP.use("/api/events", adminRoutes);

APP.use((req, res, next) => {
    const error = new Error('Route Not Found');
    error.statusCode = 404;
    next(error);
});

APP.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'An unexpected error occurred.'
    });
});

APP.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Test Event List: http://localhost:${PORT}/api/events');
});