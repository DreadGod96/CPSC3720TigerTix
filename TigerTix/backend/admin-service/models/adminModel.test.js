import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Database setup
const TEST_DATABASE_PATH = path.resolve('shared-db', 'test-database.sqlite');
const INIT_SQL_PATH = path.join('shared-db', 'init.sql');
const INIT_SQL = fs.readFileSync(INIT_SQL_PATH, 'utf-8');

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

describe('Admin Model - adminModel.js', () => {

    let Event;

    beforeEach(async () => {
        jest.resetModules();

        const eventModule = await import('../models/adminModel.js');
        Event = eventModule.default;
        
        // Create new db
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
    });

    afterEach(async () => {
        // close db connection
        await Event.close();
        
        // delete db file
        if (fs.existsSync(TEST_DATABASE_PATH)) {
            fs.unlinkSync(TEST_DATABASE_PATH);
        }
    });

    it('should successfully create an event in the database', async () => {
        const eventData = {
            event_name: 'Test Event',
            event_date: '2025-10-10',
            number_of_tickets_available: 100,
            price_of_a_ticket: 50,
        };
        
        const result = await Event.create(eventData);

        expect(result.event_id).toBe(1);
        expect(result.event_name).toBe('Test Event');
        
        const row = await queryDb('SELECT * FROM events WHERE event_id = ?', [1]);
        expect(row.event_name).toBe('Test Event');
        expect(row.number_of_tickets_available).toBe(100);
    });

    it('should reject if event_name is missing', async () => {
        const eventData = {
            event_date: '2025-10-10',
            number_of_tickets_available: 100,
            price_of_a_ticket: 50,
        };
        await expect(Event.create(eventData)).rejects.toThrow(
            'Missing required fields: event name, date, number of tickets available, and price of each ticket'
        );
    });
    
    it('should reject if number_of_tickets_available is null', async () => {
        const eventData = {
            event_name: 'Test Event',
            event_date: '2025-10-10',
            number_of_tickets_available: null,
            price_of_a_ticket: 50,
        };
        await expect(Event.create(eventData)).rejects.toThrow('Missing required fields');
    });

    it('should reject if number_of_tickets_available is negative', async () => {
        const eventData = {
            event_name: 'Test Event',
            event_date: '2025-10-10',
            number_of_tickets_available: -10,
            price_of_a_ticket: 50,
        };
        await expect(Event.create(eventData)).rejects.toThrow(
            'The number of tickets must be 0 or greater'
        );
    });

    it('should reject if price_of_a_ticket is missing', async () => {
        const eventData = {
            event_name: 'Test Event',
            event_date: '2025-10-10',
            number_of_tickets_available: 100,
        };
        await expect(Event.create(eventData)).rejects.toThrow('Missing required fields');
    });
});