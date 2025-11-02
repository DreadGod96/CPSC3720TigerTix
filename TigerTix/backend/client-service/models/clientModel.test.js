import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Database setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATABASE_PATH = path.join(__dirname, '..', '..', 'shared-db', 'test-database.sqlite');
const INIT_SQL_PATH = path.join(__dirname, '..', '..', 'shared-db', 'init.sql');
const INIT_SQL = fs.readFileSync(INIT_SQL_PATH, 'utf-8');

// Helper function to insert test data
const runDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(TEST_DATABASE_PATH);
        db.run(sql, params, function (err) {
            db.close();
            if (err) return reject(err);
            resolve(this); // 'this' contains lastID
        });
    });
};

// Helper function to query the test DB
const queryDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(TEST_DATABASE_PATH);
        db.get(sql, params, (err, row) => {
            db.close();
            if (err) return reject(err);
            resolve(row);
        });
    });
};

describe('Client Model - clientModel.js', () => {

    let Event;

    beforeEach(async () => {
        if (fs.existsSync(TEST_DATABASE_PATH)) {
            fs.unlinkSync(TEST_DATABASE_PATH);
        }
        
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(TEST_DATABASE_PATH, (err) => {
                if (err) return reject(err);
                db.exec(INIT_SQL, (err) => {
                    if (err) return reject(err);
                    db.close((err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        jest.resetModules();
        const eventModule = await import('../models/clientModel.js');
        Event = eventModule.default;
    });

    afterEach(async () => {
        await Event.close();
        
        if (fs.existsSync(TEST_DATABASE_PATH)) {
            fs.unlinkSync(TEST_DATABASE_PATH);
        }
    });


    it('should find matching events by name', async () => {
        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Test Event', '2025-10-10', 100, 50]);

        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Another Event', '2025-10-11', 100, 50]);

        const results = await Event.findMatchingEvents({ event_name: 'Test' });

        expect(results.length).toBe(1);
        expect(results[0].event_name).toBe('Test Event');
    });

    it('should successfully purchase a ticket and decrement the count', async () => {
        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Test Event', '2025-10-10', 100, 50]);
        
        const updated_ticket_count = await Event.purchaseTickets(1, 1); // eventId=1, ticket_count=1

        expect(updated_ticket_count).toBe(99);

        const row = await queryDb('SELECT number_of_tickets_available FROM events WHERE event_id = ?', [1]);
        expect(row.number_of_tickets_available).toBe(99);
    });

    it('should reject with NO_TICKETS if tickets are 0', async () => {
        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Sold Out Event', '2025-10-10', 0, 50]);

        await expect(Event.purchaseTickets(1, 1)).rejects.toThrow('NO_TICKETS');
    });

    it('should reject with NOT_FOUND if event does not exist', async () => {
        await expect(Event.purchaseTickets(99, 1)).rejects.toThrow('NOT_FOUND');
    });
});