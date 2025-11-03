import sqlite3 from "sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_TEST_ENV = process.env.NODE_ENV === 'test';
const DATABASE_NAME = IS_TEST_ENV ? 'test-database.sqlite' : 'database.sqlite';
const DATABASE_PATH = path.join(__dirname, '..', '..', 'shared-db', DATABASE_NAME);

const sqlite_3 = sqlite3.verbose();

const database = new sqlite_3.Database(DATABASE_PATH, (error) => {
    if (error) {
        console.error("Admin Model Error: Failed to connect to the database.", error.message);
    }
});

/**
 * Attempts to create a new event and add it to the database. If valid event data is passed, an event is
 * created and added to the database. If it is not, an error is returned.
 * @param {object} event_data The data for the event (name, date, number of tickets, price of tickets)
 * @returns {Promise<object>} A promise that resolves with the newly created event object. On failure,
 * rejects with an error.
 */
function create(event_data) {
    return new Promise((resolve, reject) => {
        const {event_name, event_date, number_of_tickets_available, price_of_a_ticket} = event_data;

        // Validate request has necessary data
        if (!event_name || !event_date || number_of_tickets_available == null || price_of_a_ticket == null) {
            const error = new Error("Missing required fields: event name, date, number of tickets available, and price of each ticket");
            error.code = 'VALIDATION_ERROR';
            return reject(error);
        }

        // Validate that tickets are available for purchase
        if (typeof number_of_tickets_available !== 'number' || number_of_tickets_available < 0){
            const error = new Error("The number of tickets must be 0 or greater");
            error.code = 'VALIDATION_ERROR';
            return reject(error);
        }
    
        const sql_commands = 'INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)';
        const sql_parameters = [event_name, event_date, number_of_tickets_available, price_of_a_ticket];

        // Run sql_commands queries sequentially
        database.serialize(() => {
            database.run("BEGIN TRANSACTION;", (error) => {
                if (error) {
                    return reject(error);
                }
            });

            let last_id;

            database.run(sql_commands, sql_parameters, function (error) {
                if (error) {
                    database.run("ROLLBACK;");
                    console.error("Error in Event.create:", error.message);
                    return reject(new Error('Failed to create the event in the database.'));
                }
                last_id = this.lastID;
            });

            database.run("COMMIT;", (commit_error) =>{
                if (commit_error) {
                    database.run("ROLLBACK;");
                    return reject(commit_error);
                }
                resolve({ event_id: last_id, ...event_data });
            });
        });
    });
}

/**
 * Closes the database connection. Used for testing
 * @returns {Promise<void>}
 */
function close() {
    return new Promise((resolve, reject) => {
        database.close((err) => {
            if (err) {
                console.error('Failed to close admin model DB:', err.message);
                return reject(err);
            }
            resolve();
        });
    });
}

const Event = {
    create,
    close, 
};

export default Event;

