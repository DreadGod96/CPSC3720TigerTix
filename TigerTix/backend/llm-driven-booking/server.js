import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import llmRoutes from './routes/llmRoutes.js';
import './models/llmModel.js';

const app = express();
const port = process.env.LLM_SERVICE_PORT || 7001;

// Backend API 
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/llm/parse', llmRoutes);

// Start the server if test is not set
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`LLM service running on http://localhost:${port}`);
    });
}

// export for testing
export default app;