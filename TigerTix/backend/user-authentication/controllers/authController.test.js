import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { response } from 'express';
import request from 'supertest';

const mockAddToQueue = jest.fn(task => task());
const mockFindUser = jest.fn();
const mockCreateUser = jest.fn();
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();

// unstable_mockModule() is used because mock() is NOT compatible with ES Modules
jest.unstable_mockModule('../services/queueService.js', () => ({
    default: {
        addToQueue: mockAddToQueue,
    }
}));

jest.unstable_mockModule('../models/authModel.js', () => ({
    default: {
        findUser: mockFindUser,
        createUser: mockCreateUser,
    }
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        compare: mockBcryptCompare,
        hash: mockBcryptHash,
    }
}));

describe('Authentication Controller - Unit Tests', () => {
    let app;
    let queueService;
    let AuthModel;

    beforeEach(async () => {
        // Dynamically import modules
        const appModule = await import('../server.js');
        app = appModule.default;
        
        const queueModule = await import('../services/queueService.js');
        queueService = queueModule.default;

        const authModule = await import('../models/authModel.js');
        AuthModel = authModule.default;

        //Clear mocks before each test
        mockAddToQueue.mockClear();
        mockFindUser.mockClear();
        mockCreateUser.mockClear();
        mockBcryptCompare.mockClear();
        mockBcryptHash.mockClear();
    });

    describe('POST /api/auth/register', () => {
        it('should create a new user successfully and return a 201 status code', async () => {
            const mockEmail = 'testRegister@clemson.edu';
            const mockPassword = '12qwaszx!@QWASZX';
            const mockHashedPassword = 'goRams123!@#';

            mockFindUser.mockResolvedValue(undefined); 
            mockBcryptHash.mockResolvedValue(mockHashedPassword);
            mockCreateUser.mockResolvedValue({ id: 1, email: mockEmail });

            const response = await request(app).post('/api/auth/register').send({ email: mockEmail, password: mockPassword });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.userId).toBe(1);

            expect(mockAddToQueue).toHaveBeenCalledTimes(2);
            expect(mockFindUser).toHaveBeenCalledWith(mockEmail);
            expect(mockBcryptHash).toHaveBeenCalledWith(mockPassword, 10);
        });

        it('should return a 409 status code if email is already in use', async () => {
            const mockEmail = 'testRegister@clemson.edu';
            mockFindUser.mockResolvedValue({ id: 1, email: mockEmail });

            const response = (await request(app).post('/api/auth/register')).send({ email: mockEmail, password: 'abc123ABC!@#' });

            expect(response.statusCode).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email already in use');
            expect(mockCreateUser).not.toHaveBeenCalled();
        });

        it('should return a 400 status code if email or password is missing', async () => {
            const response = await request(app).post('/api/auth/register').send({ email: 'testRegister@clemson.edu' });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('Email and password are required');
            expect(mockFindUser).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/login', () => {
        it('should log in a valid user and return a 200 status code with a token', async () => {
            const mockUser = {
                user_id: 1,
                email: 'loginTest@clemson.edu',
                password: '12qwaszx!@QWASZX'
            };

            const mockPassword = 'goRams123!@#';
            mockFindUser.mockResolvedValue(mockUser);
            mockBcryptCompare.mockResolvedValue(true);

            const response = (await request(app).post('/api/auth/login')).send({ email: mockUser.email, password: mockPassword });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(mockFindUser).toHaveBeenCalledWith(mockUser.email);
            expect(mockBcryptCompare).toHaveBeenCalledWith(mockPassword, mockUser.password);
        });

        it('should return a 401 status code for an invalid password', async () => {
            const mockUser = {
                user_id: 1,
                email: 'loginTest@clemson.edu',
                password: '12qwaszx!@QWASZX'
            };

            const mockPassword = 'wrongwrongwrong';
            mockFindUser.mockResolvedValue(mockUser);
            mockBcryptCompare.mockResolvedValue(false);

            const response = (await request(app).post('/api/auth/login')).send({ email: mockUser.email, password: mockPassword });

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return a 401 status code for an invalid user', async () => {
            mockFindUser.mockResolvedValue(undefined);

            const response = (await request(app).post('/api/auth/login')).send({ email: 'nonexistent@clemson.edu', password: 'notReal123!@#' });

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
            expect(mockBcryptCompare).not.toHaveBeenCalled();
        });
    });
});