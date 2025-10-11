
const express = require('express');
const clientController = require('../controllers/clientController');
const router = express.Router();

//GET /api/events
//Returns event list
router.get('/', clientController.listEvents);

//POST /api/events/:id/purchase
//Decrease ticket count
router.post('/:id/purchase', clientController.purchaseTicket);

module.exports = router;