import express from 'express';
import {
    getEvents,
    purchaseTicket
} from '../controllers/clientController.js';

const router = express.Router();

//GET /api/events
//Returns event list
router.get('/', getEvents);

//POST /api/events/:id/purchase
//Decrease ticket count
router.post('/:id/purchase', purchaseTicket);

export default router;