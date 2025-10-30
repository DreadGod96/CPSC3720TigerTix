
import React, { useEffect, useState } from 'react';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';
import EventList from './components/EventList/EventList';
import VoiceInput from './components/VoiceInput/VoiceInput';
import ChatBox from './components/ChatBox/ChatBox';


//Defines / constants
const app_title = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";



function App() {
    const [events, setEvents] = useState([]);

    const [statusMessage, setStatusMessage] = useState('');

    const [chatMessages, setChatMessages] = useState([
        { sender: 'bot', text: 'Hi! How can I help you find tickets today?' }
    ]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Attempt to fetch events from client service
    const fetchEvents = () => {
        fetch('http://localhost:6001/api/events')
            .then((response) => response.json())
            .then((data) => setEvents(data))
            .catch((error) => console.error(error));
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
            if (!result.error) {
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

    const handleVoiceCommand = async (text) => {
        //Send text to LLM
        //Await LLM response-->should be { event: "Jazz Night", tickets: 2 }
        //Find event details from 'events'
        //Ask user to confirm
        //Buy tickets
    }

    return (
        <div className="App">
            <HomeScreenHeading
                title={app_title}
                logo={CLEMSON_LOGO}
            />
            <div className="sr-only" aria-live="polite" role="status">
                {statusMessage}
            </div>
            <VoiceInput onSpeechResult={handleVoiceCommand} />
            <ChatBox 
                messages={chatMessages}
                isLoading={isChatLoading}
            />
            <h1>Current Available Events: </h1>
            <EventList
                events={events}
                buyTicket={buyTicket}
            />
        </div>
    );
}
export default App;