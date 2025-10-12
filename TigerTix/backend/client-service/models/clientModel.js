import sqlite3 from 'sqlite3';

// Path to database
const DATABASE_PATH = '../shared-db/database.sqlite';
const SQLITE3 = sqlite3.verbose();

// Create new 
const db = new SQLITE3.Database(DATABASE_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Client Model Error: Failed to connect to the database.", err.message);
    } else {
        console.log('Client Model connected to the SQLite database.');
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
    const sql = 'SELECT event_id, event_name, event_date, number_of_tickets_available, price_of_a_ticket FROM events ORDER BY event_id;';
    
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching events:', err.message);
                return reject(err);
            }
            resolve(rows);
        });
    });
};
 
/**
 * Helper function to promisify db.run
 * @param {sqlite3.Database} db the SQlite database connection instance.
 * @param {string} sql SQL statement to be executed
 * @param {any[]} params optional array of parameters for the statements placeholders
 * @returns {Promise{lastID: number, changes: number}} Promise that resolves the 'this' context in 
 * 'db.run' callbacks
 */
const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});
 
/**
 * Helper function to promisify db.get
 * @param {sqlite3.Database} db the SQlite database connection instance.
 * @param {string} sql SQL statement to be executed
 * @param {any[]} params optional array of parameters for the statements placeholders
 * @returns {Promise<object|undefined>} A promise that resolves with either the first row found by the
 * query or 'undefined' if no row is found that matches the query. Rejects with an error
 */
const get = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});
 
/**
 * Simulates the purchase of a single ticket, and decrements the number of tickets for an event in the 
 * database by 1
 * @param {number} eventId The id of the event that someone is purchasing a ticket for
 * @returns {Promise<number>} Promise that resolves with the updated number of tickets for an event
 * @throws {Error} throws an error and a specific message based on what caused the error:
 * - 'NOT_FOUND': If no event exists with the id of eventId in the database
 * - 'NO_TICKETS': If the event that is requested has 0 tickets available
 * - 'DB_UPDATE_ERROR': All other generic database failures that can occur
 */
export const purchaseTicket = async (eventId) => {
    return new Promise((resolve, reject) => {

        // Execute SQL commands sequentially
        db.serialize(async () => {
            try {
                await run(db, "BEGIN TRANSACTION;");
                
                const row = await get(db, 'SELECT number_of_tickets_available FROM events WHERE event_id = ?', [eventId]);
        
                if (!row) {
                    await run(db, "ROLLBACK;");
                    return reject(new Error('NOT_FOUND'));
                }
        
                const currentTickets = row.number_of_tickets_available;
        
                if (currentTickets <= 0) {
                    await run(db, "ROLLBACK;");
                    return reject(new Error('NO_TICKETS'));
                }
                
                const updateSql = 'UPDATE events SET number_of_tickets_available = number_of_tickets_available - 1 WHERE event_id = ?';
                await run(db, updateSql, [eventId]);
        
                await run(db, "COMMIT;");
        
                resolve(currentTickets - 1);
        
            } catch (error) {
                console.error("Database transaction failed:", error.message);
                //cawait run(db, "ROLLBACK;").catch(rbErr => console.error("Failed to rollback:", rbErr));
                reject(new Error('DB_UPDATE_ERROR'));
            }
        });
    });
};


const Event = {
    findAllEvents,
    purchaseTicket
};

export default Event;