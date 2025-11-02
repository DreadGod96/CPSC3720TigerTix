import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_TEST_ENV = process.env.NODE_ENV === 'test';
const DATABASE_NAME = IS_TEST_ENV ? 'test-database.sqlite' : 'database.sqlite';
const DATABASE_PATH = path.join(__dirname, '..', '..', 'shared-db', DATABASE_NAME);

const sqlite_3 = sqlite3.verbose();

const database = new sqlite_3.Database(DATABASE_PATH, sqlite3.OPEN_READWRITE, (error) => {
    if (error) {
        console.error("Client Model Error: Failed to connect to the database.", error.message);
    }
});

/**
 * Fetches all the events from the database
 * @returns {Promise{Array<{
 * event_id: number, 
 * event_name: string, 
 * event_date: string,
 * number_of_tickets_available: number,
 * price_of_a_ticket: number}}} A promise that resolves with an array of event objects and rejects with
 * an error
 */
export const findAllEvents = async () => {
    const sql_commands = 'SELECT event_id, event_name, event_date, number_of_tickets_available, price_of_a_ticket FROM events ORDER BY event_id;';
    
    return new Promise((resolve, reject) => {
        database.all(sql_commands, [], (error, rows) => {
            if (error) {
                console.error('Error fetching events:', error.message);
                return reject(error);
            }
            resolve(rows);
        });
    });
};

/**
 * Fetches events from the database that match the provided filters.
 * If no filters are provided, it returns all events.
 * @param {object} [filters={}] An object containing key-value pairs to filter on.
 * @param {string} [filters.event_name] - The name of the event to search for (partial match).
 * @param {string} [filters.event_date] - The exact date of the event to search for (YYYY-MM-DD).
 * @returns {Promise<Array<object>>} A promise that resolves with an array of matching event objects.
 */
export const findMatchingEvents = async (filters = {}) => {
    // If no filters are provided, default to returning all events.
    if (!filters || Object.keys(filters).length === 0) {
        return findAllEvents();
    }

    let sql_command = 'SELECT event_name, event_date, number_of_tickets_available, price_of_a_ticket FROM events';
    const where_clauses = [];
    const parameters = [];
    const valid_columns = ['event_name', 'event_date', 'price_of_a_ticket', 'number_of_tickets_available'];

    for (const key in filters) {
        if (Object.prototype.hasOwnProperty.call(filters, key) && valid_columns.includes(key)) {
            if (key === 'event_name') {
                where_clauses.push(`${key} LIKE ?`);
                parameters.push(`%${filters[key]}%`);
            } else {
                where_clauses.push(`${key} = ?`);
                parameters.push(filters[key]);
            }
        }
    }

    if (where_clauses.length > 0) {
        sql_command += ' WHERE ' + where_clauses.join(' AND ');
    }

    sql_command += ' ORDER BY event_id;';

    return new Promise((resolve, reject) => {
        database.all(sql_command, parameters, (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
};
 
/**
 * Helper function to promisify database.run
 * @param {sqlite3.Database} database the SQlite database connection instance.
 * @param {string} sql_commands SQL statement(s) to be executed. Multiple statements must be provided as single string 
 *                              with semi-colon separated statements
 * @param {any[]} parameters optional array of parameters for the statements placeholders
 * @returns {Promise{lastID: number, changes: number}} Promise that resolves the 'this' context in 
 * 'database.run' callbacks
 */
const run = (database, sql_commands, parameters = []) => new Promise((resolve, reject) => {
    database.run(sql_commands, parameters, function (error) {
        if (error) reject(error);
        else resolve(this);
    });
});
 
/**
 * Helper function to promisify database.get
 * @param {sqlite3.Database} database the SQlite database connection instance.
 * @param {string} sql_commands SQL statement(s) to be executed. Multiple statements must be provided as single string 
 *                              with semi-colon separated statements
 * @param {any[]} parameters optional array of parameters for the statements placeholders
 * @returns {Promise<object|undefined>} A promise that resolves with either the first row found by the
 * query or 'undefined' if no row is found that matches the query. Rejects with an error
 */
const get = (database, sql_commands, parameters = []) => new Promise((resolve, reject) => {
    database.get(sql_commands, parameters, (error, row) => {
        if (error) reject(error);
        else resolve(row);
    });
});
 
/**
 * Simulates the purchase of tickets, and decrements the number of tickets for an event in the 
 * database by ticket_count
 * @param {number} event_id The ID of the event that someone is purchasing a ticket for
 * @param {number} ticket_count The number of tickets being purchased
 * @returns {Promise<number>} Promise that resolves with the updated number of tickets for an event
 * @throws {Error} throws an error and a specific message based on what caused the error:
 * - 'NOT_FOUND': If no event exists with the id of event_id in the database
 * - 'NO_TICKETS': If the event that is requested has 0 tickets available
 * - 'DB_UPDATE_ERROR': All other generic database failures that can occur
 */
export const purchaseTickets = async (event_id, ticket_count) => {
    return new Promise((resolve, reject) => {

        database.serialize(() => {
            
            database.run("BEGIN TRANSACTION;", (err) => {
                if (err) {
                    console.error("BEGIN TRANSACTION failed:", err.message);
                    return reject(new Error('DB_UPDATE_ERROR'));
                }
            });

            database.get('SELECT number_of_tickets_available FROM events WHERE event_id = ?', [event_id], (err, row) => {
                if (err) {
                    database.run("ROLLBACK;");
                    return reject(new Error('DB_CHECK_ERROR'));
                }
                if (!row) {
                    database.run("ROLLBACK;");
                    return reject(new Error('NOT_FOUND'));
                }
            
                const current_tickets = row.number_of_tickets_available;
            
                if (current_tickets <= 0 || current_tickets < ticket_count) {
                    database.run("ROLLBACK;");
                    return reject(new Error('NO_TICKETS'));
                }
                
                const update_tickets_sql_command = 'UPDATE events SET number_of_tickets_available = number_of_tickets_available - ? WHERE event_id = ?';
                database.run(update_tickets_sql_command, [ticket_count, event_id], function (err) {
                    if (err) {
                        database.run("ROLLBACK;");
                        return reject(new Error('DB_UPDATE_ERROR'));
                    }
                });

                database.run("COMMIT;", (err) => {
                    if (err) {
                        database.run("ROLLBACK;");
                        return reject(new Error('COMMIT_ERROR'));
                    }
                    resolve(current_tickets - ticket_count);
                });

            });
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
                console.error('Failed to close client model DB:', err.message);
                return reject(err);
            }
            resolve();
        });
    });
}

const Event = {
    findAllEvents,
    purchaseTickets,
    findMatchingEvents,
    close
};

export default Event;