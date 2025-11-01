import express from 'express';
import cors from 'cors';
import llmRoutes from './routes/llmRoutes.js';
import './models/llmModel.js';

const app = express();

//Declare client service port
const port = 7001;

//Backend API 
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/llm/parse', llmRoutes);

//Start the server
app.listen(port, () => {
    console.log(`LLM service running on http://localhost:${port}`);
});

