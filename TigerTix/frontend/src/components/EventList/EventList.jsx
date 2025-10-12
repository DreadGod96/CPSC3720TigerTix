import EventItem from "./EventItem";

export default function EventList({events}) {
    const buyTicket = (eventName) => {
        alert(`Ticket purchased for: ${eventName}`);
    };

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