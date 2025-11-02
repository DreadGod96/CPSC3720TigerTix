import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const mockAddToQueue = jest.fn(task => task());
const mockEventCreate = jest.fn();

// unstable_mockModule() is used because mock() is NOT compatible with ES Modules
jest.unstable_mockModule('../services/queueService.js', () => ({
    default: {
        addToQueue: mockAddToQueue,
    }
}));

jest.unstable_mockModule('../models/adminModel.js', () => ({
    default: {
        create: mockEventCreate,
    }
}));

// Setup database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(__dirname, '..', '..', 'shared-db', 'test-database.sqlite');
const initSqlPath = path.join(__dirname, '..', '..', 'shared-db', 'init.sql');
const initSql = fs.readFileSync(initSqlPath, 'utf-8');
let db;


describe('Admin Controller - /api/events', () => {
    let app;
    let queueService;
    let Event;

   beforeEach(async () => {
        const appModule = await import('../server.js');
        app = appModule.default;
        
        const queueModule = await import('../services/queueService.js');
        queueService = queueModule.default;

        const eventModule = await import('../models/adminModel.js');
        Event = eventModule.default;

        mockAddToQueue.mockClear();
        mockEventCreate.mockClear();

        // Set up the test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        await new Promise((resolve, reject) => {
            db = new sqlite3.Database(testDbPath, (err) => {

                if (err) return reject(err);

                db.exec(initSql, (err) => {
                    if (err) return reject(err);
                    db.close((err) => {
                        if (err) return reject(err);
                        resolve(); 
                    });
                });

            });
        });
    });

    // Clean up the test database
    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('POST /api/events', () => {

        it('should create an event successfully and return 201', async () => {
            const mockEventData = {
                event_name: 'Clemson vs. FSU Football',
                event_date: '2025-10-25',
                number_of_tickets_available: 80000,
                price_of_a_ticket: 150,
            };

            const createdEvent = { ...mockEventData, event_id: 'mock-id-123' };
            Event.create.mockResolvedValue(createdEvent);

            const response = await request(app)
                .post('/api/events')
                .send(mockEventData);

            // Assertions
            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(createdEvent);

            // Check that queue and model were called correctly
            expect(queueService.addToQueue).toHaveBeenCalledTimes(1);
            expect(Event.create).toHaveBeenCalledWith(mockEventData);
        });

        it('should return 400 on validation error', async () => {
            const invalidEventData = {
                event_date: '2025-11-01',
                number_of_tickets_available: 100,
                price_of_a_ticket: 50,
            };

            const validationError = new Error("Missing required fields...");
            validationError.code = 'VALIDATION_ERROR';
            Event.create.mockRejectedValue(validationError);

            const response = await request(app)
                .post('/api/events')
                .send(invalidEventData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should return 400 for a negative number of tickets', async () => {
            const invalidEventData = {
                event_name: 'Negative Ticket Event',
                event_date: '2025-12-01',
                number_of_tickets_available: -100,
                price_of_a_ticket: 50,
            };

            const validationError = new Error("The number of tickets must be 0 or greater");
            validationError.code = 'VALIDATION_ERROR';
            mockEventCreate.mockRejectedValue(validationError);

            const response = await request(app)
                .post('/api/events')
                .send(invalidEventData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("The number of tickets must be 0 or greater");
        });

        it('should return 400 when number_of_tickets_available is null', async () => {
            const invalidEventData = {
                event_name: 'Null Ticket Event',
                event_date: '2025-12-01',
                number_of_tickets_available: null, 
                price_of_a_ticket: 50,
            };

            const validationError = new Error("Missing required fields: event name, date, number of tickets available, and price of each ticket");
            validationError.code = 'VALIDATION_ERROR';
            mockEventCreate.mockRejectedValue(validationError);

            const response = await request(app)
                .post('/api/events')
                .send(invalidEventData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing required fields');
        });

        it('should return 500 if a non-validation error occurs in the model', async () => {
            const mockEventData = {
                event_name: 'Database Fail Event',
                event_date: '2025-12-01',
                number_of_tickets_available: 100,
                price_of_a_ticket: 50,
            };

            const dbError = new Error("A rare database error occurred");
            mockEventCreate.mockRejectedValue(dbError);

            const response = await request(app)
                .post('/api/events')
                .send(mockEventData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Server error: Could not create the event");
        });
    });
});