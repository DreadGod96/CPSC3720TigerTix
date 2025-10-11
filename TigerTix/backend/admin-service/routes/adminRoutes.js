import express from "express";
const ROUTER = express.Router();

import{
    getEvents,
    createEvent
} from "../controllers/adminController.js";

ROUTER.get("/", getEvents);
ROUTER.post("/", createEvent);

export default ROUTER;