
import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, Outlet } from 'react-router-dom';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';
import EventList from './components/EventList/EventList';
import ChatBox from './components/ChatBox/ChatBox.jsx';
import BookingConfirmationModal from './components/BookingConfirmationModal/BookingConfirmationModal.jsx';


const app_title = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";

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



function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to log in.');
            }

            // store token and update state
            onLogin({ email, password, token: data.token });
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Login to TigerTix</h2>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Log In</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}


function RegisterPage({ onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register.');
            }

            // successful registration, move to login
            navigate('/login');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Register</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <p>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}




function ProtectedRoute({ isAuthenticated }) {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}




function MainPage({ onLogout, token, credentials }) {
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
    const buyTicket = async (eventName, eventID, ticket_count = 1) => {
        try {
            const response = await fetch(`http://localhost:6001/api/events/${eventID}/purchase`, {
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
        
        // Add user's message to the chat immediately
        const newUserMessage = { sender: 'user', text: message };
        
        setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
        setIsChatLoading(true);
        
        try {
            let currentChatHistory = [];
            setChatMessages(prevMessages => {
                currentChatHistory = prevMessages.map(msg => ({
                    role: msg.sender === 'bot' ? 'model' : 'user',
                    parts: [{ text: msg.text }]
                }));
                return prevMessages; 
            });

            const response = await fetch('http://localhost:7001/api/llm/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_input: message,
                    chat_history: currentChatHistory, 
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot.');
            }

            const data = await response.json();
            
            setChatMessages(prev => [...prev, { sender: 'bot', text: data.model_response.text }]);

            speak(data.model_response.text);
            console.log(data);


            if(data.booking_details){
                console.log('handling');
                handleAiBooking(data.booking_details);
            }

        } catch (error) {
            console.error("Error sending message to chatbot:", error);
            setChatMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
            speak(error.message);
        
        } finally {
            setIsChatLoading(false);
        }
    }, []);

    return (
        <div className="App">
            <HomeScreenHeading
                title={app_title}
                logo={CLEMSON_LOGO}
            />
            <div className="header-actions">
                <button onClick={onLogout} className="logout-button">Logout</button>
                <p className="logged-in-user">Logged in as {credentials?.email}</p>
            </div>
            <div className="sr-only" aria-live="polite" role="status">
                {statusMessage}
            </div>
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
};


function App() {
    
    // state for user auth
    const [authToken, setAuthToken] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const isAuthenticated = !!authToken;

    // token refresh timer
    useEffect(() => {
        let refreshTimeout;

        const refreshToken = async () => {
            if (!credentials) return;

            try {

                const response = await fetch('http://localhost:8001/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
                });
                const data = await response.json();

                if (response.ok) {

                    // new token is set, effect will run again
                    setAuthToken(data.token); 
                } else {

                    // If refresh fails, log out
                    handleLogout(); 
                }

            } catch (error) {
                console.error("Failed to refresh token:", error);
                handleLogout();
            }
        };

        if (authToken) {
            // Token expires in 30 mins (1800000 ms). Refresh 1 minute before.
            const REFRESH_INTERVAL = 29 * 60 * 1000; // 29 minutes
            refreshTimeout = setTimeout(refreshToken, REFRESH_INTERVAL);
        }

        // Cleanup function to clear the timer
        return () => clearTimeout(refreshTimeout);

    }, [authToken, credentials]); // Rerun when token or credentials change

    const handleLogin = ({ email, password, token }) => {
        setCredentials({ email, password });
        setAuthToken(token);
    };

    const handleLogout = () => {
        setAuthToken(null);
        setCredentials(null);
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                    <Route path="/" element={<MainPage onLogout={handleLogout} token={authToken} credentials={credentials} />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;