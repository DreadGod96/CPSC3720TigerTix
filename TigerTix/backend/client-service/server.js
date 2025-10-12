import express from 'express';
import cors from 'cors';
import clientRoutes from './routes/clientRoutes.js';
import './models/clientModel.js';

const app = express();
//Declare client service port
const PORT = 6001;

//Backend API 
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/events', clientRoutes);

//Start the server
app.listen(PORT, () => {
    console.log(`Client service running on http://localhost:${PORT}`);
    console.log(`Test Event List: http://localhost:${PORT}/api/events`);
});

