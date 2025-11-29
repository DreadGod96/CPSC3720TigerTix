import React, { useEffect, useState, useCallback } from 'react';

//Import components
import HomeScreenHeading from '../../components/HomeScreenHeading/HomeScreenHeading';
import EventList from '../../components/EventList/EventList';
import ChatBox from '../../components/ChatBox/ChatBox.jsx';
import BookingConfirmationModal from '../../components/BookingConfirmationModal/BookingConfirmationModal.jsx';
import { CLEMSON_LOGO } from '../../App';

const app_title = "TigerTix";

const speak = (text) => {
    if (!window.speechSynthesis) {
        console.warn("Browser does not support speech synthesis.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
};

export default function MainPage({ onLogout, token, credentials }) {
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
        const CLIENT_URL = process.env.REACT_APP_CLIENT_API_URL;
        fetch(`${CLIENT_URL}/api/events`)
            .then((response) => response.json())
            .then((data) => setEvents(data))
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Attempt to buy ticket from given event
    const buyTicket = async (eventName, eventID, ticket_count = 1) => {
        try {
            const CLIENT_URL = process.env.REACT_APP_CLIENT_API_URL;
            const response = await fetch(`${CLIENT_URL}api/events/${eventID}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticket_count: ticket_count
                })
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

    const handleAiBooking = (bookingDetails) => {
        setBookingDetails(bookingDetails);
        setIsModalOpen(true);
    };

    const handleConfirmBooking = () => {
        try {
            if (bookingDetails) {
                buyTicket(bookingDetails.event_name, bookingDetails.event_id, bookingDetails.tickets_to_book);
            }
        } catch (error) {
            console.error('Error handling event booking:', error);
            alert(`Error: ${error.message}`);
            setStatusMessage(`Error: ${error.message}`);
        }
        setIsModalOpen(false);
        setBookingDetails(null);
    };

    const onSendMessage = useCallback(async (message) => {
        const newUserMessage = { sender: 'user', text: message };
        setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
        setIsChatLoading(true);
        try {
            const currentChatHistory = [...chatMessages, newUserMessage].map(msg => ({
                role: msg.sender === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            
            const LLM_URL = process.env.REACT_APP_LLM_API_URL;
            const response = await fetch(`${LLM_URL}/api/llm/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: message, chat_history: currentChatHistory }),
            });

            if (!response.ok) throw new Error('Failed to get response from chatbot.');

            const data = await response.json();
            setChatMessages(prev => [...prev, { sender: 'bot', text: data.model_response.text }]);
            speak(data.model_response.text);

            if (data.booking_details) handleAiBooking(data.booking_details);

        } catch (error) {
            console.error("Error sending message to chatbot:", error);
            const errorMessage = { sender: 'bot', text: error.message };
            setChatMessages(prev => [...prev, errorMessage]);
            speak(error.message);
        } finally {
            setIsChatLoading(false);
        }
    }, [chatMessages]);

    return (
        <div className="App">
            <HomeScreenHeading title={app_title} logo={CLEMSON_LOGO} />
            <div className="header-actions">
                <button onClick={onLogout} className="logout-button">Logout</button>
                <p className="logged-in-user">Logged in as {credentials?.email}</p>
            </div>
            <div className="sr-only" aria-live="polite" role="status">{statusMessage}</div>
            <ChatBox messages={chatMessages} isLoading={isChatLoading} onSendMessage={onSendMessage} />
            <BookingConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmBooking} details={bookingDetails} />
            <h1>Current Available Events: </h1>
            <EventList events={events} buyTicket={buyTicket} />
        </div>
    );
}
