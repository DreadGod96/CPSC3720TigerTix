import express from "express";
import{
    getChatbotResponse
} from "../controllers/llmController.js";

const router = express.Router();

router.post("/", getChatbotResponse);

export default router;