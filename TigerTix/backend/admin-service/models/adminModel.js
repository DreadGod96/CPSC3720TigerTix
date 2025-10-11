import sqlite3 from "sqlite3";

const SQLITE3 = sqlite3.verbose();

const db = new SQLITE3.Database('./../shared-db/database.sqlite', (err) => {
    if (err) {
        console.error("Model Error: Failed to connect to the database.", err.message);
    } else {
        console.log('Model connected to the SQLite database.');
    }
});

function findAll(){
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM events";
        db.all(sql, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function create(eventData) {
    return new Promise((resolve, reject) => {
        const {event_name, event_date, number_of_tickets_available, price_of_a_ticket} = eventData;

        if (!event_name || !event_date || number_of_tickets_available == null || price_of_a_ticket == null) {
            return reject(new Error("Missing required fields."));
        }

        const sql = 'INSERT INTO events (event_name, event_date, number_of_tickets_available, price_of_a_ticket) VALUES (?, ?, ?, ?)';
        const params = [event_name, event_date, number_of_tickets_available, price_of_a_ticket];

        // The `function` keyword is used here to get access to `this.lastID`.
        db.run(sql, params, function (err) {
            if (err) {
                console.error("Error in Event.create:", err.message);
                reject(new Error('Failed to create the event in the database.'));
            } else {
                // Resolve with the newly created event object
                resolve({ event_id: this.lastID, ...eventData });
            }
        });
    });
}

// Export an object that matches the structure your controller expects.
const Event = {
    findAll,
    create,
};

export default Event;

