import express from "express";
import sqlite3 from "sqlite3";
import adminRoutes from "./routes/adminRoutes.js";

const SQLITE3 = sqlite3.verbose(); //verbose for more detailed logging

//Database assumed to be created at this point
//const DATABASE = new SQLITE3.Database('./backend/shared-db/database.sqlite');

const APP = express();
const PORT = 5000;

// Setup middleware
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Routes
APP.get("/", (req, res) => {
    res.send("Hello World");
});

// Example route setup
APP.use("/api/events", adminRoutes);

APP.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});