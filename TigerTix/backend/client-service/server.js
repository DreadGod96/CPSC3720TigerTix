import express from 'express';
import cors from 'cors';
import clientRoutes from './routes/clientRoutes.js';
import './models/clientModel.js';

const app = express();

//Declare client service port
const port = 6001;

//Backend API 
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/events', clientRoutes);

//Start the server
app.listen(port, () => {
    console.log(`Client service running on http://localhost:${port}`);
    console.log(`Test Event List: http://localhost:${port}/api/events`);
});

