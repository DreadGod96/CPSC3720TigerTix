import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Database setup
const TEST_DATABASE_PATH = path.resolve('shared-db', 'test-database.sqlite');
const INIT_SQL_PATH = path.join('shared-db', 'init.sql');
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


describe('Authentication Model - authModel.js', () => {

    let Authenticate;

    beforeEach(async () => {

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

        jest.resetModules();
        const authenticateModule = await import('../models/authModel.js');
        Authenticate = authenticateModule.default;
    });


    afterEach(async () => {
        // close db connection
        await Authenticate.close();
        
        // delete db file
        if (fs.existsSync(TEST_DATABASE_PATH)) {
            fs.unlinkSync(TEST_DATABASE_PATH);
        }
    });

    it('should find an existing user by email', async () => {
        const userData = {
            testEmail: 'testFind@clemson.edu',
            testPassword: 'goTigers123!@#',
        };
        
        await runDb("INSERT INTO users (email, password) VALUES (?, ?)", [userData.testEmail, userData.testPassword]);
        const result = await Authenticate.findUser(userData.testEmail);

        expect(result).toBeDefined();
        expect(result.email).toBe(userData.testEmail);
        expect(result.password).toBe(userData.testPassword);
    });

    it('should return undefined if user does not exist', async () => {
        const result = await Authenticate.findUser('nonexistent@clemson.edu')

        expect(result).toBeUndefined();
    });
    
    it('should successfully create a new user', async () => {
        const userData = {
            email: 'newUser@clemson.edu',
            password: 'goRams123!@#',
        };
        
        const result = await Authenticate.createUser(userData);

        expect(result.id).toBe(1);
        expect(result.email).toBe(userData.email);
    });

    it('should reject if email is not unique', async () => {
        const userData = {
            testEmail: 'theDude@clemson.edu',
            testPassword: 'helloWorld123!@#',
        };
        await runDb("INSERT INTO users (email, password) VALUES (?, ?)", [userData.testEmail, userData.testPassword]);

        await expect(Authenticate.createUser({
            email: userData.testEmail,
            password: 'aNewPassword'
        })).rejects.toThrow('SQLITE_CONSTRAINT');
    });
});

