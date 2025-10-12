import express from "express";
const ROUTER = express.Router();

import{
    createEvent
} from "../controllers/adminController.js";

ROUTER.post("/", createEvent);

export default ROUTER;