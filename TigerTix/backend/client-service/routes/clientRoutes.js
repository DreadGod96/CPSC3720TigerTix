import express from "express";
import {
    getEvents,
    purchaseTickets
} from "../controllers/clientController.js";

const router = express.Router();

//GET /api/events
//Returns event list. Can be filtered with query parameters.
//Example: /api/events?event_name=Movie Night
router.get("/", getEvents);

//POST /api/events/:id/purchase
//Decrease ticket count
router.post("/:id/purchase", purchaseTickets);

export default router;