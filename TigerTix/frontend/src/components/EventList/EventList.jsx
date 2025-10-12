import EventItem from "../EventItem/EventItem";
import "./EventList.css";

export default function EventList({events, buyTicket}) {

    return (
        <ul className="event-list" aria-label="List of available events">
            {
                events.map((event) => (
                    <EventItem
                        key={event.event_id}
                        event={event}
                        buyTicket={buyTicket}
                    />
                ))
            }
        </ul>
    );
}