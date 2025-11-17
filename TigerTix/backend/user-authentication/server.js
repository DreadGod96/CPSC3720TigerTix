import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import './models/authModel.js';


const app = express();
const port = process.env.USER_AUTH_SERVICE_PORT || 8001;

// Backend API 
app.use(cors());
app.use(express.json());

// Backend API 
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Start the server if test is not set
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`User Auth service running on http://localhost:${port}`);
    });
}

// export for testing
export default app;