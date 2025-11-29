import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import './models/authModel.js';


const app = express();
const port = process.env.USER_AUTH_SERVICE_PORT || 8001;

// Backend API 
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

// Routes
app.use('/api/auth', authRoutes);

// Health Check for Render
app.get('/', (req, res) => res.status(200).send('Auth Service Running'));

// Start the server if test is not set
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`User Auth service running on http://localhost:${port}`);
    });
}

// export for testing
export default app;