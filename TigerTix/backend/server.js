import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

//import routers
import authRoutes from './user-authentication/routes/authRoutes.js';
import adminRoutes from './admin-service/routes/adminRoutes.js';
import clientRoutes from './client-service/routes/clientRoutes.js';
import llmRoutes from './llm-driven-booking/routes/llmRoutes.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://tigertixfrontend.vercel.app",
        "https://tigertixfrontend-2eaq3b9np-elis-projects-195b117e.vercel.app"

    ],
    credentials: true,
}));
app.use(express.json());

//map routers to frontend pathing
app.use('/api/auth', authRoutes);
app.use('/api/events', adminRoutes);
app.use('/api/events', clientRoutes);
app.use('/api/llm/parse', llmRoutes);

app.get('/', (req,res) => {
    res.send("Backend is running");
});

//start server
app.listen(PORT, () => {
    console.log(`backend server is running on port ${PORT}`);
});