CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY,
    event_name varchar(255),
    event_date date,
    number_of_tickets_available int,
    price_of_a_ticket decimal
)