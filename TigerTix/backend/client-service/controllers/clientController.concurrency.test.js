import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Database Setup ---
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
            resolve(this);
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

describe('Client Controller - Concurrency Tests', () => {

    let app;
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
        const appModule = await import('../server.js');
        app = appModule.default;
        
        const eventModule = await import('../models/clientModel.js');
        Event = eventModule.default;
    });

    afterEach(async () => {
        await Event.close();
        
        if (fs.existsSync(TEST_DATABASE_PATH)) {
            fs.unlinkSync(TEST_DATABASE_PATH);
        }
    });

    // --- YOUR NEW TESTS ---

    it('should handle 10 concurrent requests for 5 tickets, failing 5', async () => {
        const eventId = 1;
        const totalTickets = 5;
        const numRequests = 10;
        const ticketsToBuy = 1;

        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Limited Event', '2025-11-11', totalTickets, 100]);
        
        // Create an array of 10 identical request promises
        const purchasePromises = [];
        for (let i = 0; i < numRequests; i++) {
            purchasePromises.push(
                request(app)
                    .post(`/api/events/${eventId}/purchase`)
                    .send({ ticket_count: ticketsToBuy })
            );
        }

        // Run 10 requests concurrently
        const results = await Promise.allSettled(purchasePromises);

        const successful = results.filter(r => r.value?.statusCode === 200);
        const failed = results.filter(r => r.value?.statusCode === 400);

        expect(successful.length).toBe(totalTickets);
        expect(failed.length).toBe(numRequests - totalTickets);
        
        // Verify the failure reason
        expect(failed[0].value.body.error).toBe('Purchase failed: Not enough tickets available.');
        
        const row = await queryDb('SELECT number_of_tickets_available FROM events WHERE event_id = ?', [eventId]);
        expect(row.number_of_tickets_available).toBe(0);
    }, 10000); 

    it('should handle 50 concurrent requests for 20 tickets, failing 30', async () => {
        const eventId = 1;
        const totalTickets = 20;
        const numRequests = 50;
        const ticketsToBuy = 1;

        await runDb("INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)", 
            ['Popular Event', '2025-12-01', totalTickets, 50]);
        
        // Create an array of 50 identical request promises
        const purchasePromises = [];
        for (let i = 0; i < numRequests; i++) {
            purchasePromises.push(
                request(app)
                    .post(`/api/events/${eventId}/purchase`)
                    .send({ ticket_count: ticketsToBuy })
            );
        }

        // Run requests concurrently
        const results = await Promise.allSettled(purchasePromises);

        const successful = results.filter(r => r.value?.statusCode === 200);
        const failed = results.filter(r => r.value?.statusCode === 400);

        expect(successful.length).toBe(totalTickets);
        expect(failed.length).toBe(numRequests - totalTickets);
        
        // Verify the failure reason
        expect(failed[0].value.body.error).toBe('Purchase failed: Not enough tickets available.');
        
        const row = await queryDb('SELECT number_of_tickets_available FROM events WHERE event_id = ?', [eventId]);
        expect(row.number_of_tickets_available).toBe(0);
    }, 15000); 
});