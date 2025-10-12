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

//Fetch all events from database
//Returns an array of event objects
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
 
// Helper to promisify db.run
const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});
 
// Helper to promisify db.get
const get = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});
 
 
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