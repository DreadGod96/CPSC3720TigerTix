
export default function EventItem({event, buyTicket}) {
    return (
        <div>
            <li key={event.event_id}>
                Event Name: {event.event_name} <br/>
                Event Date: {event.event_date} <br/>
                Tickets Available: {event.number_of_tickets_available} <br/>
                <button onClick={() => buyTicket(event.event_name, event.event_id)}>Buy Ticket</button>
            </li>
        </div>
    );
}