
import React, { useEffect, useState } from 'react';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';
import EventList from './components/EventList/EventList';


//Defines / constants
const APP_TITLE = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";



function App() {
    const [events, setEvents] = useState([]);

    const [statusMessage, setStatusMessage] = useState('');

    const fetchEvents = () => {
        fetch('http://localhost:6001/api/events')
        .then((res) => res.json())
        .then((data) => setEvents(data))
        .catch((err) => console.error(err));
    };
    
    useEffect(() => {
        fetchEvents();
    }, []);

    const buyTicket = async (eventName, eventID) => {
        try {
            const response = await fetch(`http://localhost:6001/api/events/${eventID}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to purchase ticket.');
            }

            const result = await response.json();
            if(!result.error) {
                const successMessage = `Successfully purchased ticket for: ${eventName}!`;
                alert(successMessage);
                setStatusMessage(successMessage);
            } else {
                alert(`Error: ${result.error}`);
                setStatusMessage(`Error: ${result.message}`);
            }
            
            fetchEvents();
            
        } catch (error) {
            console.error('Purchase error:', error);
            const errorMsg = `Error: ${error.message}`;
            alert(errorMsg);
            setStatusMessage(errorMsg);
        }
    };

    return (
        <div className="App">
            <HomeScreenHeading
                title={APP_TITLE}
                logo={CLEMSON_LOGO}
            />
            <div className="sr-only" aria-live="polite" role="status">
                {statusMessage}
            </div>
            <h1>Current Available Events: </h1>
            <EventList
                events={events}
                buyTicket={buyTicket}
            />
        </div>
    );
}
export default App;