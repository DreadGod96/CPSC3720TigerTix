import sqlite3 from "sqlite3";

const DATABASE_PATH = './../shared-db/database.sqlite';
const SQLITE3 = sqlite3.verbose();

const db = new SQLITE3.Database(DATABASE_PATH, (err) => {
    if (err) {
        console.error("Admin Model Error: Failed to connect to the database.", err.message);
    } else {
        console.log('Admin Model connected to the SQLite database.');
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

        if (!event_name || !event_date || number_of_tickets_available == null || price_of_a_ticket == null) {
            const err = new Error("Missing required fields: you must include an event name, date, number of tickets, and price of each ticket");
            err.code = 'VALIDATION_ERROR';
            return reject(err);
        }
        if (typeof number_of_tickets_available !== "number" || number_of_tickets_available < 0){
            const err = new Error("The number of tickets must be 0 or greater");
            err.code = 'VALIDATION_ERROR';
            return reject(err);
        }
        if (typeof price_of_a_ticket !== "number" || price_of_a_ticket < 0){
            const err = new Error("The price of a ticket must be 0 or greater");
            err.code = 'VALIDATION_ERROR';
            return reject(err);
        }
    
        const sql = 'INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)';
        const params = [event_name, event_date, number_of_tickets_available, price_of_a_ticket];

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;", (err) => {
                if (err){
                    return reject(err);
                }
            });

            db.run(sql, params, function (err) {
                if (err) {
                    db.run("ROLLBACK;");
                    console.error("Error in Event.create:", err.message);
                    return reject(new Error('Failed to create the event in the database.'));
                }

                db.run("COMMIT;", (commitErr) =>{
                    if (commitErr){
                        db.run("ROLLBACK;");
                        return reject(commitErr);
                    }
                    resolve({ event_id: this.lastID, ...eventData });
                });
            });

        });
    });
}

// Export object for controller
const Event = {
    create
};

export default Event;

