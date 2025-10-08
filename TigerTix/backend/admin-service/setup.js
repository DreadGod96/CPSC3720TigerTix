const SQLITE3 = require('sqlite3').verbose(); //verbose for more detailed logging

let DATABASE;

/**
 * Attempts to open existing database. If opening fails or database does not exist, returns false.
 * Otherwise, return true.
 * @returns {boolean} If the database was opened successfully or not.
 */
async function openDatabase() {
    DATABASE = new SQLITE3.Database('./backend/shared-db/database.sqlite', (error) => {
    if(error) {
        //TODO: add call here to run `init.sql` to make sqlite database
        
        return false
    }

    console.log('Connected to the database.');
});
}