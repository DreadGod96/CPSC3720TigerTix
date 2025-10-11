import express from 'express';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

//GET /api/events
//Returns event list
router.get('/', clientController.listEvents);

//POST /api/events/:id/purchase
//Decrease ticket count
router.post('/:id/purchase', clientController.purchaseTicket);

export default router;