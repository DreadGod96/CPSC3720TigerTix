
import React, { useEffect, useState } from 'react';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';
import EventList from './components/EventList/EventList';
import VoiceInput from './components/VoiceInput/VoiceInput';
import ChatBox from './components/ChatBox/ChatBox.jsx';
import BookingConfirmationModal from './components/BookingConfirmationModal/BookingConfirmationModal.jsx';


const app_title = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";


function App() {
    const [events, setEvents] = useState([]);

    const [statusMessage, setStatusMessage] = useState('');

    const [chatMessages, setChatMessages] = useState([
        { sender: 'bot', text: 'Hi! How can I help you find tickets today?' }
    ]);

    const [isChatLoading, setIsChatLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

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

    // Attempt to buy ticket from given event
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

    const handleAiBooking = (bookingDetails) => {
        setBookingDetails(bookingDetails);
        setIsModalOpen(true);
    };

    const handleConfirmBooking = () => {
        try {
            if (bookingDetails) {
                buyTicket(bookingDetails.event_name, bookingDetails.event_id);
            }
        } catch (error) {
            console.error('Error handling event booking:', error);
            alert(`Error: ${error.message}`);
            setStatusMessage(`Error: ${error.message}`);
        }
        setIsModalOpen(false);
        setBookingDetails(null);
    };

    const onSendMessage = async (message) => {
        
        // Add user's message to the chat immediately
        const newUserMessage = { sender: 'user', text: message };
        setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
        setIsChatLoading(true);
        console.log(chatMessages);

        try {
            
            const response = await fetch('http://localhost:7001/api/llm/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_input: message,
                    chat_history: chatMessages, 
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot.');
            }

            const data = await response.json();
            
            setChatMessages(prev => [...prev, { sender: 'bot', text: data.model_response.text }]);
            console.log(data);


            if(data.booking_details){
                console.log('handling');
                handleAiBooking(data.booking_details);
            }

        } catch (error) {
            console.error("Error sending message to chatbot:", error);
            setChatMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
        
        } finally {
            setIsChatLoading(false);
        }
    };

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
                onSendMessage={onSendMessage}
            />
            <BookingConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBooking}
                details={bookingDetails}
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