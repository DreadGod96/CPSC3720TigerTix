import sqlite3 from 'sqlite3';

//Path to the shared db
const DATABASE_PATH = '../shared-db/database.sqlite';

//Connect to the shared db
function openDatabase() {
    return new Promise((resolve, reject) => {
        const mode = sqlite3.OPEN_READWRITE;
        const db = new sqlite3.Database(DATABASE_PATH, mode, (err) => {
            if (err) {
                console.error('Database failed to open:', err.message);
                return reject(err);
            }
            resolve(db);
        });
    });
}

//Fetch all events from database
//Returns an array of event objects
export const findAllEvents = async () => {
    const db = await openDatabase();
    const sql = 'SELECT event_id, event_name, event_date, number_of_tickets_available, price_of_a_ticket FROM events ORDER BY event_id;';
    
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            db.close(); 
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

    const db = await openDatabase(); 

    try {

        // Start transaction
        await run(db, "BEGIN TRANSACTION;");
        
        const row = await get(db, 'SELECT number_of_tickets_available FROM events WHERE event_id = ?', [eventId]);
 
        if (!row) {
            await run(db, "ROLLBACK;");
            throw new Error('NOT_FOUND');
        }
 
        const currentTickets = row.number_of_tickets_available;
 
        if (currentTickets <= 0) {
            await run(db, "ROLLBACK;");
            throw new Error('NO_TICKETS');
        }
        
        const updateSql = 'UPDATE events SET number_of_tickets_available = number_of_tickets_available - 1 WHERE event_id = ?';
        await run(db, updateSql, [eventId]);
 
        // End transaction
        await run(db, "COMMIT;");
 
        return currentTickets - 1;
 
    } catch (error) {

        // If any errors occur, try to rollback
        try {
            await run(db, "ROLLBACK;");
        } catch (error) {
            console.error("Failed to rollback:", error);
        }
 
        // Throw original error back to controller
        if (error.message === 'NOT_FOUND' || error.message === 'NO_TICKETS') {
            throw error;
        }

        // Throw general database error to controller
        console.error("Database transaction failed:", error.message);
        throw new Error('DB_UPDATE_ERROR');

    } finally {
        
        // Close database as good practice
        if (db) {
            db.close((err) => {
                if (err) console.error("Error closing the database:", err.message);
            });
        }
    }
};


const Event = {
    findAllEvents,
    purchaseTicket
};

export default Event;