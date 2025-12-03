import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//Setup Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFolder = path.join(__dirname, 'shared-db');
const dbPath = path.join(dbFolder, 'database.sqlite');

//Ensure folder exists
if (!fs.existsSync(dbFolder)){
    fs.mkdirSync(dbFolder, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const seed = async () => {
    console.log(`Seeding Database at ${dbPath}...`);

    db.serialize(() => {
        //Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )`);

        //Create Events Table
        db.run(`CREATE TABLE IF NOT EXISTS events (
            event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT,
            event_date TEXT,
            number_of_tickets_available INTEGER,
            price_of_a_ticket REAL
        )`);

        //Insert Demo User
        const hash = bcrypt.hashSync("password123", 10);
        const insertUser = db.prepare("INSERT OR REPLACE INTO users (email, password) VALUES (?, ?)");
        insertUser.run("demo@tiger.com", hash);
        insertUser.finalize();
        console.log("User 'demo@tiger.com' created.");

        //Insert Demo Events
        const insertEvent = db.prepare(`INSERT INTO events 
            (event_name, event_date, number_of_tickets_available, price_of_a_ticket) 
            VALUES (?, ?, ?, ?)`);
        
        insertEvent.run("Clemson vs. USC", "2025-11-29", 100, 150.00);
        insertEvent.run("Hackathon 2025", "2025-12-01", 50, 20.00);
        insertEvent.run("End of Semester Party", "2025-12-10", 200, 0.00);
        
        insertEvent.finalize();
        console.log("Events created.");
    });

    db.close((err) => {
        if (err) console.error(err.message);
        console.log("Seeding Complete.");
    });
};

seed();