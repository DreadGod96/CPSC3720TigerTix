import express from "express";
const router = express.Router();

import{
    getChatbotResponse
} from "../controllers/llmController.js";

router.post("/", getChatbotResponse);

export default router;