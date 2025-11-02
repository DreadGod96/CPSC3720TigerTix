import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';

const mockAddToQueue = jest.fn(task => task()); 
const mockManageConversation = jest.fn(); 

jest.unstable_mockModule('../services/queueService.js', () => ({
    default: {
        addToQueue: mockAddToQueue,
    }
}));

jest.unstable_mockModule('../models/llmModel.js', () => ({
    default: {
        // Mock the 'Event' object's manageConversation method
        manageConversation: mockManageConversation,
    }
}));


describe('LLM Controller - /api/llm/parse', () => {
    let app;
    let queueService;
    let llmModel;

    beforeEach(async () => {
        // Dynamically import modules
        const appModule = await import('../server.js');
        app = appModule.default;

        const queueModule = await import('../services/queueService.js');
        queueService = queueModule.default;

        const modelModule = await import('../models/llmModel.js');
        llmModel = modelModule.default; // This is 'Event' in your controller
        
        // Clear mocks
        mockAddToQueue.mockClear();
        mockManageConversation.mockClear();
    });

    describe('POST /api/llm/parse', () => {

        it('should return a successful chatbot response and return 200', async () => {
            const requestBody = {
                user_input: 'Hello, what events are on for tomorrow?',
                chat_history: []
            };

            const mockModelResponse = {
                response: 'Hello! I found 3 events for tomorrow.',
                history: [
                    { role: 'user', parts: [{ text: 'Hello, what events are on for tomorrow?' }] },
                    { role: 'model', parts: [{ text: 'Hello! I found 3 events for tomorrow.' }] }
                ],
                booking_details: null
            };

            // Set the mock implementation for this test
            mockManageConversation.mockResolvedValue(mockModelResponse);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.model_response).toBe(mockModelResponse.response);
            expect(response.body.chat_history).toEqual(mockModelResponse.history);
            expect(response.body.booking_details).toBeNull();

            // Check that the queue and model were called correctly
            expect(mockAddToQueue).toHaveBeenCalledTimes(1);
            expect(mockManageConversation).toHaveBeenCalledWith(
                requestBody.user_input,
                requestBody.chat_history
            );
        });

        it('should return 400 on an invalid input error', async () => {
            const requestBody = {
                user_input: '',
                chat_history: []
            };

            // Error defined in controller try-catch
            const invalidInputError = new Error('INVALID_INPUT_NONE');
            mockManageConversation.mockRejectedValue(invalidInputError);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Your input was invalid. Please provide a valid text message.');
            
            // Check that the queue was still called
            expect(mockAddToQueue).toHaveBeenCalledTimes(1);
        });

        it('should return booking details when a booking is successful', async () => {
            const requestBody = {
                user_input: 'Yes, please book 2 tickets for the Movie Night.',
                chat_history: [
                    { role: 'user', parts: [{ text: 'Hello, what events are on for tomorrow?' }] },
                    { role: 'model', parts: [{ text: 'I found 1 event for tomorrow: Movie Night. Would you like to book for it?' }] }
                ]
            };

            const mockBookingDetails = {
                event_id: 1,
                event_name: 'Movie Night',
                tickets_to_book: 2,
                price_per_ticket: 10.50,
                total_price: "21.00"
            };
            
            const mockModelResponse = {
                response: 'Great! I have prepared that booking for you. The total is $21.00. Does this look correct?',
                history: [
                    { role: 'user', parts: [{ text: 'Hello, what events are on for tomorrow?' }] },
                    { role: 'model', parts: [{ text: 'I found 1 event for tomorrow: Movie Night. Would you like to book for it?' }] },
                    { role: 'user', parts: [{ text: 'Yes, please book 2 tickets for the Movie Night.' }] },
                ],
                booking_details: mockBookingDetails 
            };

            // Set the mock implementation for this test
            mockManageConversation.mockResolvedValue(mockModelResponse);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.booking_details).toEqual(mockBookingDetails); // Check for booking details
            expect(response.body.model_response).toBe(mockModelResponse.response);
        });

        it('should return 503 when the model blocks an inappropriate question', async () => {
            const requestBody = {
                user_input: 'This is an inappropriate question.',
                chat_history: []
            };

            // Error defined in controller try-catch
            const safetyError = new Error('MODEL_RESPONSE_BLOCKED');
            mockManageConversation.mockRejectedValue(safetyError);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(503);
            expect(response.body.error).toBe("I'm sorry, but I can't provide a response to that. It may have violated our safety policies. Please try rephrasing your message.");
        });

        it('should return 400 for input containing code', async () => {
            const requestBody = {
                user_input: 'Book { event: "Test" } tickets',
                chat_history: []
            };

            // Error defined in controller try-catch
            const codeError = new Error('INVALID_INPUT_CODE');
            mockManageConversation.mockRejectedValue(codeError);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Your input appears to contain code or special characters, which is not allowed.");
        });

        it('should return 400 for input that is too long', async () => {
            const requestBody = {
                user_input: 'A'.repeat(300),
                chat_history: []
            };
            
            // Error defined in controller try-catch
            const longInputError = new Error('INVALID_INPUT_TOO_LONG');
            mockManageConversation.mockRejectedValue(longInputError);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Your input was invalid. Please provide a valid text message.");
        });

        it('should return 500 for a generic LLM service error', async () => {
            const requestBody = {
                user_input: 'Hello',
                chat_history: []
            };

            // This is the default/generic error
            const genericError = new Error('LLM_SERVICE_ERROR');
            mockManageConversation.mockRejectedValue(genericError);

            const response = await request(app)
                .post('/api/llm/parse')
                .send(requestBody);

            // Assertions
            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe("The chatbot service is currently experiencing issues. Please try again later.");
        });
    });
});