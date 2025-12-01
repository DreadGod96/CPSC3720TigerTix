import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanInput, findEvents, bookTickets } from '../models/llmModel.js';

const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe('llmModel.js', () => {
    
    beforeEach(() => {
        global.fetch = mockFetch;
        mockFetch.mockClear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('cleanInput', () => {
        it('should resolve with the trimmed string for valid input', async () => {
            await expect(cleanInput('  hello ')).resolves.toBe('hello');
        });

        it('should reject for non-string input', async () => {
            await expect(cleanInput(12345)).rejects.toThrow('INVALID_INPUT_TYPE');
        });

        it('should reject for empty or blank input', async () => {
            await expect(cleanInput('   ')).rejects.toThrow('INVALID_INPUT_NONE');
        });

        it('should reject for input that is too long', async () => {
            const longString = 'a'.repeat(300);
            await expect(cleanInput(longString)).rejects.toThrow('INVALID_INPUT_TOO_LONG');
        });

        it('should reject for input containing code-like characters', async () => {
            await expect(cleanInput('hello { world }')).rejects.toThrow('INVALID_INPUT_CODE');
            await expect(cleanInput('hello <script>')).rejects.toThrow('INVALID_INPUT_CODE');
        });
    });

    describe('findEvents (tool)', () => {
        it('should call fetch with the correct URL parameters', async () => {
            const mockEvents = [{ event_name: 'Test Event', event_date: '2025-11-05' }];
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockEvents,
            });

            const result = await findEvents({ date: '2025-11-05', event_name: 'Test' });

            // Check if fetch was called with the correct URL
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('http://localhost:10000/api/events?event_date=2025-11-05&event_name=Test')
            );

            expect(result).toBe(JSON.stringify({ events: mockEvents }));
        });

        it('should return a "no events found" message if API returns empty array', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            const result = await findEvents({ date: '2025-11-05' });

            expect(result).toBe(JSON.stringify({ events: [], message: `No events found matching the criteria.` }));
        });

        it('should return an error message if fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network failure'));

            const result = await findEvents({ date: '2025-11-05' });

            expect(result).toBe(JSON.stringify({ error: `Failed to fetch events from client-service: Network failure` }));
        });
    });

    describe('bookTickets (tool)', () => {
        const mockEventsList = [
            { event_id: 1, event_name: "Movie Night", number_of_tickets_available: 50, price_of_a_ticket: 10 },
            { event_id: 2, event_name: "Jazz Night", number_of_tickets_available: 2, price_of_a_ticket: 25 },
        ];

        it('should prepare booking details for a valid request', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockEventsList,
            });

            const result = await bookTickets({ event_name: 'Movie Night', ticket_count: 2 });
            
            const expectedDetails = {
                booking_details: {
                    event_id: 1,
                    event_name: "Movie Night",
                    tickets_to_book: 2,
                    price_per_ticket: 10,
                    total_price: "20.00"
                }
            };
            
            expect(result).toBe(JSON.stringify(expectedDetails));
        });

        it('should return an error if the event is not found', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockEventsList,
            });

            const result = await bookTickets({ event_name: 'Nonexistent Event', ticket_count: 2 });
            
            expect(result).toBe(JSON.stringify({ success: false, error: "Event 'Nonexistent Event' not found." }));
        });

        it('should return an error if not enough tickets are available', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockEventsList,
            });

            const result = await bookTickets({ event_name: 'Jazz Night', ticket_count: 5 });
            
            expect(result).toBe(JSON.stringify({ 
                success: false, 
                error: "Sorry, only 2 tickets are available for 'Jazz Night'." 
            }));
        });
    });
});