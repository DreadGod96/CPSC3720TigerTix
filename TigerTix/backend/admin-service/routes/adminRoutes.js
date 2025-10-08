import express from "express";

const ROUTER = express.Router();

import {
    sendHelloWorld,
} from "./../models/adminModel.js"

ROUTER.get("/", sendHelloWorld);

export default ROUTER;