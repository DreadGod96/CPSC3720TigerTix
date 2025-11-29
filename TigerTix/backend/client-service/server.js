import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import clientRoutes from './routes/clientRoutes.js';
import './models/clientModel.js';

const app = express();

// Declare client service port
const port = process.env.CLIENT_SERVICE_PORT || 6001;

// Backend API 
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://tigertixfrontend.vercel.app"
    ],
    credentials: true,
    methods:['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/events', clientRoutes);

// Health Check for Render
app.get('/', (req, res) => res.status(200).send('Client Service Running'));

// Start the server if test is not set
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Client service running on http://localhost:${port}`);
        console.log(`Test Event List: http://localhost:${port}/api/events`);
    });
}

// Export app for testing
export default app;