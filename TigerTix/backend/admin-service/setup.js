import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const DATABASE_DIR = path.join('..','shared-db');
const DATABASE_FILE = path.join(DATABASE_DIR, 'database.sqlite');
const INIT_SCRIPT = path.join(DATABASE_DIR, 'init.sql');

/**
 * Attempts to open existing database. If opening fails or database does not exist, returns false.
 * Otherwise, return true.
 * @returns {boolean} If the database was opened successfully or not.
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        let initSql;
        try {
            initSql = fs.readFileSync(INIT_SCRIPT, 'utf-8');
        } catch (error) {
            console.error('DB SETUP ERROR: Could not read init.sql schema');
            return reject(error);
        }
 
        if(fs.existsSync(DATABASE_FILE)){
            return resolve();
        }

        //Connect to database/Create database
        const db = new sqlite3.Database(DATABASE_FILE, (err) => {
            if (err) {
                console.error('DB SETUP ERROR: Failed to connect to/create the database', err.message);
                return reject(err);
            }
 
            //execute init.sql
            db.exec(initSql, function (execErr) {
                db.close();
                if (execErr) {
                    console.error('DB SETUP ERROR: SQL script failed to execute.', execErr.message);
                    return reject(execErr);
                }
                resolve();
            });
        });
    });
}

openDatabase()
    .catch((error) => {
        console.error('Database creation failed: ', error);
    });
