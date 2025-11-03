import "./EventItem.css";

export default function EventItem({event, buyTicket}) {

    const eventDate = new Date(event.event_date.replace(/-/g, '\/')).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
       <li className="event-item" aria-labelledby={`event-name-${event.event_id}`}>
            <div className="event-details">
                <h2 id={`event-name-${event.event_id}`} className="event-name">{event.event_name}</h2>
                <p className="event-date">{eventDate}</p>
                <p className="event-tickets">
                    Tickets Available: <strong>{event.number_of_tickets_available}</strong>
                </p>
            </div>
            <div className="event-actions">
                <button 
                    className="buy-ticket-button"
                    onClick={() => buyTicket(event.event_name, event.event_id)}
                    aria-label={`Buy one ticket for ${event.event_name}`}
                >
                    Buy Ticket
                </button>
            </div>
        </li>
    );
}