import sqlite3 from "sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isTestEnv = process.env.NODE_ENV === 'test';
const dbName = isTestEnv ? 'test-database.sqlite' : 'database.sqlite';
const database_path = path.join(__dirname, '..', '..', 'shared-db', dbName);

const sqlite_3 = sqlite3.verbose();

const database = new sqlite_3.Database(database_path, (error) => {
    if (error) {
        console.error("Admin Model Error: Failed to connect to the database.", error.message);
    }
});

/**
 * Attempts to create a new event and add it to the database. If valid event data is passed, an event is
 * created and added to the database. If it is not, an error is returned.
 * @param {object} eventData The data for the event (name, date, number of tickets, price of tickets)
 * @returns {Promise<object>} A promise that resolves with the newly created event object. On failure,
 * rejects with an error.
 */
function create(eventData) {
    return new Promise((resolve, reject) => {
        const {event_name, event_date, number_of_tickets_available, price_of_a_ticket} = eventData;

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

            // Begin transaction
            database.run("BEGIN TRANSACTION;", (error) => {
                if (error){
                    return reject(error);
                }
            });

            // Attempt to create new event
            database.run(sql_commands, sql_parameters, function (error) {
                if (error) {
                    database.run("ROLLBACK;");
                    console.error("Error in Event.create:", error.message);
                    return reject(new Error('Failed to create the event in the database.'));
                }
                
            });

            database.run("COMMIT;", (commitError) =>{
                if (commitError){
                    database.run("ROLLBACK;");
                    return reject(commitError);
                }
                resolve({ event_id: this.lastID, ...eventData });
            });

        });
    });
}

// Export object for controller
const Event = {
    create
};

export default Event;

