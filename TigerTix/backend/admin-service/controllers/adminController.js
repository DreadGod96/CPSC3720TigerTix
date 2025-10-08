// /******************************
//  * 
//  * 
//  *  IMPORTANT, BELOW IS JUST AN EXAMPLE, BASICALLY PSEUDO CODE
//  * 
//  *  CHANGE IT TO BE IN A FUNCTION CALL FOR PROPER USAGE
//  * 
//  */



//Define commands
const db = new sqlite3.Database('./backend/shared-db/database.sqlite');
const sql = 'INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)';
const params = [eventData.name, eventData.date, eventData.tickets];

// The db.run method executes the query
db.run(sql, params, function(err) {
    if (err) {

        // Handle error
        return;
    }
    // The 'this.lastID' contains the ID of the new row.
});

db.close();


// // Example POST method
async function addData() {
    const DatabaseEndpoint = 'http://localhost:5000/api/events';
    const request = await fetch(DatabaseEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            "hi": "hi"
        }),
    });

    const response = await request.json();
    console.log(response);
}

