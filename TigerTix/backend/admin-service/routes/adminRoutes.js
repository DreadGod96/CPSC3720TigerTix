import express from "express";
const router = express.Router();

import{
    createEvent
} from "../controllers/adminController.js";

router.post("/", createEvent);

export default router;