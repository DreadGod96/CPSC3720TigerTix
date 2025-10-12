import EventItem from "./EventItem";

export default function EventList({events, buyTicket}) {

    return (
        <ul>
            {
                events.map((event) => (
                    <EventItem
                        event={event}
                        buyTicket={buyTicket}
                    />
                ))
            }
        </ul>
    );
}