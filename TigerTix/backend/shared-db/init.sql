CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY,
    event_name varchar(255),
    event_date date,
    number_of_tickets_available int,
    price_of_a_ticket decimal
)

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    email varchar(255), NOT NULL UNIQUE
    password TEXT NOT NULL
)