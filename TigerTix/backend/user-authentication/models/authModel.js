import sqlite3 from "sqlite3";
import path, { resolve } from 'path';



const IS_TEST_ENV = process.env.NODE_ENV === 'test';
const DATABASE_NAME = IS_TEST_ENV ? 'test-database.sqlite' : 'database.sqlite';
const DATABASE_PATH = path.resolve('shared-db', DATABASE_NAME);

const sqlite_3 = sqlite3.verbose();

const database = new sqlite_3.Database(DATABASE_PATH, sqlite3.OPEN_READWRITE, (error) => {
    if (error) {
        console.error("Authentication Model Error: Failed to connect to the database.", error.message);
    }
});

/**
 * Finds a user in the database using their email address
 * @param {string} email The user's email address
 * @returns {Promise<object|undefined>} A promise that resolves with the user row if found by the query,
 * or 'undefined' if no row is found that matches the query. Rejects with an error. 
 */
const findUser = (email) => {
    return new Promise((resolve, reject) => {
        const sql_cmd = `SELECT * FROM users WHERE email = ?`

        database.get(sql_cmd, [email], (err,row) => {
            if (err) {
                console.error("Database error in findUser:", err.message);
                reject(err);
            }
            resolve(row);
        });
    });
};

/**
 * Creates a new user in the database
 * @param {string} email The new user's email address
 * @param {string} password The new user's already hashed password
 * @returns {Promise<{id: number, email: string}>} A promise that resolves with the new user's id and email 
 */
const createUser = (userData) => {
    const { email, password } = userData;

    return new Promise((resolve, reject) => {
        const sql_cmd = `INSERT INTO users (email, password) VALUES (?, ?)`;
        
        database.run(sql_cmd, [email, password], function (err) {
            if (err) {
                console.error("Database error in createUser:", err.message);
                reject(err);
            }
            resolve({ id: this.lastID, email});
        });
    });
};

/**
 * Closes the database connection. Used for testing
 * @returns {Promise<void>}
 */
function close() {
    return new Promise((resolve, reject) => {
        database.close((err) => {
            if (err) {
                console.error('Failed to close authentication model DB:', err.message);
                return reject(err);
            }
            resolve();
        });
    });
}

const Authenticate = {
    findUser,
    createUser,
    close, 
};

export default Authenticate;

