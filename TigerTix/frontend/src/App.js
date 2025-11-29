
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import './App.css';

// Import pages from the new routes directory
import LoginPage from './routes/Login/LoginPage';
import RegisterPage from './routes/Register/RegisterPage';
import MainPage from './routes/Main/MainPage';
import ProtectedRoute from './routes/ProtectedRoute';

export const CLEMSON_LOGO = "/paw-orange.png";

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
                const AUTH_URL = process.env.REACT_APP_AUTH_API_URL;
                const response = await fetch(`${AUTH_URL}/api/auth/login`, {
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