import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';

// Mock definitions
const mockAddToQueue = jest.fn(task => task()); 
const mockFindMatchingEvents = jest.fn();
const mockPurchaseTickets = jest.fn();

// Mock the dependencies
jest.unstable_mockModule('../services/queueService.js', () => ({
    default: {
        addToQueue: mockAddToQueue,
    }
}));

jest.unstable_mockModule('../models/clientModel.js', () => ({
    default: {
        findMatchingEvents: mockFindMatchingEvents,
        purchaseTickets: mockPurchaseTickets,
    }
}));

describe('Client Controller - Unit Tests', () => {
    let app;
    let queueService;
    let Event; 

    beforeEach(async () => {
        const appModule = await import('../../server.js');
        app = appModule.default;

        const queueModule = await import('../services/queueService.js');
        queueService = queueModule.default;

        const modelModule = await import('../models/clientModel.js');
        Event = modelModule.default;
        
        // Clear mocks before each test
        mockAddToQueue.mockClear();
        mockFindMatchingEvents.mockClear();
        mockPurchaseTickets.mockClear();
    });

    describe('GET /api/events', () => {
        it('should return all events with a 200 status code', async () => {
            const mockEvents = [
                { event_id: 1, event_name: 'Event 1' },
                { event_id: 2, event_name: 'Event 2' }
            ];
            mockFindMatchingEvents.mockResolvedValue(mockEvents);

            const response = await request(app).get('/api/events');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockEvents);
            expect(mockFindMatchingEvents).toHaveBeenCalledWith({});
        });

        it('should pass query parameters to findMatchingEvents', async () => {
            const mockFilteredEvents = [
                { event_id: 1, event_name: 'Filtered Event' }
            ];
            mockFindMatchingEvents.mockResolvedValue(mockFilteredEvents);
            
            const response = await request(app).get('/api/events?event_name=Filtered');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockFilteredEvents);
            expect(mockFindMatchingEvents).toHaveBeenCalledWith({ event_name: 'Filtered' });
        });

        it('should return 500 if the model throws an error', async () => {
            mockFindMatchingEvents.mockRejectedValue(new Error('Database failure'));

            const response = await request(app).get('/api/events');

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe('Failed to retrieve events.');
        });
    });

    describe('POST /api/events/:id/purchase', () => {
        it('should purchase tickets successfully and return 200', async () => {
            const ticketCount = 2;
            const eventId = 1;
            mockPurchaseTickets.mockResolvedValue(98);

            const response = await request(app)
                .post(`/api/events/${eventId}/purchase`)
                .send({ ticket_count: ticketCount });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockPurchaseTickets).toHaveBeenCalledWith(eventId, ticketCount);
        });

        it('should return 400 for an invalid (non-numeric) event ID', async () => {
            const response = await request(app)
                .post('/api/events/abc/purchase')
                .send({ ticket_count: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid Event ID.');
            expect(mockPurchaseTickets).not.toHaveBeenCalled();
        });

        it('should return 404 if the model throws NOT_FOUND', async () => {
            const eventId = 99;
            mockPurchaseTickets.mockRejectedValue(new Error('NOT_FOUND'));

            const response = await request(app)
                .post(`/api/events/${eventId}/purchase`)
                .send({ ticket_count: 1 });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe(`Event with ID ${eventId} not found.`);
        });

        it('should return 400 if the model throws NO_TICKETS', async () => {
            mockPurchaseTickets.mockRejectedValue(new Error('NO_TICKETS'));

            const response = await request(app)
                .post('/api/events/1/purchase')
                .send({ ticket_count: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Purchase failed: Not enough tickets available.');
        });

        it('should return 500 for any other unexpected error', async () => {
            mockPurchaseTickets.mockRejectedValue(new Error('UNEXPECTED_FAILURE'));

            const response = await request(app)
                .post('/api/events/1/purchase')
                .send({ ticket_count: 1 });

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe('An unknown server error occurred.');
        });
    });
});