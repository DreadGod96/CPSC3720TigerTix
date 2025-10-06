
import React, { useEffect, useState } from 'react';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';



//Defines / constants
const APP_TITLE = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";



function App() {
    const [events, setEvents] = useState([]);
    
    useEffect(() => {
        fetch('http://localhost:5000/api/events')
        .then((res) => res.json())
        .then((data) => setEvents(data))
        .catch((err) => console.error(err));
    }, []);

    
    const buyTicket = (eventName) => {
        alert(`Ticket purchased for: ${eventName}`);
    };

    return (
        <div className="App">
            <HomeScreenHeading
                title={APP_TITLE}
                logo={CLEMSON_LOGO}
            />
            <ul>
                {events.map((event) => (
                    <li key={event.id}>
                        {event.name} - {event.date}{' '}
                        <button onClick={() => buyTicket(event.name)}>Buy Ticket</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default App;