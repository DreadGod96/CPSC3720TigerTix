# CPSC3720TigerTix
The Clemson Campus Event Ticketing System is a team-based semester-long project that extends a basic React + Node.js application.

# Database Setup
TigerTix uses SQLite for a light-weight database. To initialize the database and create the necessary tables, run the setup script from the project's root directory.

- On Linux / macOS:
```bash
$ sqlite3 backend/shared-db/database.sqlite < backend/shared-db/init.sql
```

- On Windows:

1. Open the SQLite shell and connect to the database file:
```powershell
sqlite3 backend/shared-db/database.sqlite
```

2. Once inside the `sqlite>` prompt, use the .read command to execute the script:
```sql
.read backend/shared-db/init.sql
```

3. Exit the SQLite shell:
```sql
.exit
```