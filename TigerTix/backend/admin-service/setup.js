import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//Helpers, defining paths to the db files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//define the absolute path to the database directory
const SHARED_DB_DIR = path.join(__dirname, '..', 'shared-db');
//define the absolute path to the database file
const DATABASE_FILE = path.join(__dirname, '..', 'shared-db', 'database.sqlite');
//define the absolute path to the sqlite initialization script
const INIT_SCRIPT = path.join(__dirname, '..', 'shared-db', 'init.sql');
/**
 * Attempts to open existing database. If opening fails or database does not exist, returns false.
 * Otherwise, return true.
 * @returns {boolean} If the database was opened successfully or not.
 */
export async function openDatabase() {
    let initSql;
    try {
        initSql = fs.readFileSync(INIT_SCRIPT, 'utf-8');
    }
    catch (error) {
        console.error('DB SETUP ERROR: Could not read init.sql schema');
    }

    //Connect to database/Create database
    const db = new sqlite3.Database(DATABASE_FILE, (err) => {
        if (err) {
            console.error('DB SETUP ERROR: Failed to connect to/create the database');
        }
        console.log('DB file successfully opened/created');
    });

    return new Promise((resolve, reject) => {
        //Database doesnt execute until init.sql is loaded
        if (!initSql) {
            db.closel
            return reject(new Error('Init SQL was not loaded.'));
        }
        //execute init.sql
        db.exec(initSql, function (error) {
            db.close();
            if (error) {
                console.log('DB SETUP ERROR: SQL script failed to execute.');
                return reject(error);
            }
            console.log('Database table successfully created/verified');
            resolve();
        });
    });
}
