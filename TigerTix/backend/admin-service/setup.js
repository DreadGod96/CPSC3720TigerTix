import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const database_directory = path.join('..','shared-db');
const database_file = path.join(database_directory, 'database.sqlite');
const database_init_script_file = path.join(database_directory, 'init.sql');

/**
 * Attempts to open an existing database or create a new one if it doesn't exist.
 * Initializes the database schema if a new database is created.
 * @returns {Promise<void>} A Promise that resolves if the database is successfully opened/created and initialized,
 *                          or rejects if an error occurs during the process.
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        let initSql;
        try {
            initSql = fs.readFileSync(database_init_script_file, 'utf-8');
        } catch (error) {
            console.error('DB SETUP ERROR: Could not read init.sql schema');
            return reject(error);
        }
 
        if(fs.existsSync(database_file)){
            return resolve();
        }

        //Connect to database/Create database
        const database = new sqlite3.Database(database_file, (error) => {
            if (error) {
                console.error('DB SETUP ERROR: Failed to connect to/create the database', error.message);
                return reject(error);
            }
            
            //execute init.sql
            database.exec(initSql, function (executionError) {
                database.close();
                if (executionError) {
                    console.error('DB SETUP ERROR: SQL script failed to execute.', executionError.message);
                    return reject(executionError);
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
