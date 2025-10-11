const sqlite3 = require('sqlite3').verbose();

//Path to the shared db
const DATABASE = '../shared-db/database.sqlite';

//Connect to the db
const DB = new sqlite3.Database(DATABASE, (err) => {
    if (err) {
        //Log critical error
        console.log('Client service connected to Events Database.');
    }
});

//Fetch all events from database
//Returns an array of event objects
exports.findAllEvents = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT event_id, event_name, event_date, number_of_tickets_available, price_of_a_ticket FROM Events ORDER BY event_id';

        DB.all(sql, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

//Reduce and manage ticket count for event IDs with transactions
exports.purchaseTicket = (eventId) => {
    return new Promise((resolve, reject) => {
        DB.serialize(() => {
            //start transaction
            db.run("BEGIN TRANSACTION;");

            //check ticket count
            db.get('SELECT number_of_tickets_availavle FROM events WHERE event_id = ?', [eventId], (err, row) => {
                if (err) {
                    db.run("ROLLBACK;");
                    return reject(new Error('DB_CHECK_ERROR'));
                }

                if (!row) {
                    db.run("ROLLBACK;");
                    return reject(new Error('NOT_FOUND'));
                }

                const currentTickets = row.number_of_tickets_available;

                //Prevent overselling
                if (currentTickets <= 0) {
                    db.run("ROLLBACK;");
                    return reject(new Error('NO_TICKETS'));
                }

                //Decrease ticket count by 1
                const updateSql = 'UPDATE events SET number_of_tickets_available = number_of_ticketS_available - 1 WHERE event_id = ?';

                db.run(updateSql, [eventId], function (updateErr) {
                    if (updateErr) {
                        db.run("ROLLBACK;");
                        return reject(new Error('DB_UPDATE_ERROR'));
                    }

                    //commit the transaction
                    db.run("COMMIT;", (commitErr) => {
                        if (commitErr) {
                            db.run("ROLLBACK;");
                            return reject(new Error('COMMIT_ERROR'));
                        }

                        //resolve with new ticket count
                        resolve(currentTickets - 1);
                    });
                });
            });
        });
    })
};