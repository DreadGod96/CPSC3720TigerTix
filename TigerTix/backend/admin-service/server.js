import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors"
import { openDatabase } from "./setup.js";

// Define constants
const app = express();
const port = process.env.ADMIN_SERVICE_PORT || 5001;

// Setup middleware
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://tigertixfrontend.vercel.app",
        "https://tigertixfrontend-2eaq3b9np-elis-projects-195b117e.vercel.app"
    ],
    credentials: true,
    methods:['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes
app.use("/api/events", adminRoutes);

// Health Check for Render
app.get('/', (req, res) => res.status(200).send('Client Service Running'));

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

const startServer = () => {
    // Attempt to create database if it does not exist
    openDatabase()
        .then(() => {
            app.listen(port, () => {
                console.log(`Server running on port ${port}`);
                console.log(`Test Event List: http://localhost:${port}/api/events`);
            });
        })
        .catch((error) => {
            console.error('Failed to initialize database:', error);
            process.exit(1);
        });
};

// Only start if not in test mode
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

// Export for testing
export default app;