
const express = require('express');
const cors = require('cors');
//import clientModel on startup
require('./models/clientModel');
const clientRoutes = require('./routes/clientRoutes');

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
    console.log('Client service running on http://localhost:${PORT}');
    console.log('Test Event List: http://localhost:${PORT}/api/events');
});

