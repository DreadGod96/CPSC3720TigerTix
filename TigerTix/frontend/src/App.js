
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages from the new routes directory
import LoginPage from './routes/Login/LoginPage';
import RegisterPage from './routes/Register/RegisterPage';
import MainPage from './routes/Main/MainPage';
import ProtectedRoute from './routes/ProtectedRoute';

export const CLEMSON_LOGO = "/paw-orange.png";

function App() {

    // state for user auth
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
    const [credentials, setCredentials] = useState(() => {
        const savedCreds = localStorage.getItem('credentials');
        return savedCreds ? JSON.parse(savedCreds) : null;
    });
    const isAuthenticated = !!authToken;

    // 
    useEffect(() => {
        if (authToken && credentials) {
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('credentials', JSON.stringify(credentials));
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('credentials');
        }
    }, [authToken, credentials]);


    // token refresh timer and initial load from localStorage
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
            // Calculations below = 29 minutes
            const REFRESH_INTERVAL = 29 * 60 * 1000;
            refreshTimeout = setTimeout(refreshToken, REFRESH_INTERVAL);
        }

        // Cleanup function to clear the timer
        return () => clearTimeout(refreshTimeout);

    }, [authToken, credentials]);

    const handleLogin = ({ email, password, token }) => {
        setCredentials({ email, password });
        setAuthToken(token);
    };

    const handleLogout = () => {
        setAuthToken(null);
        setCredentials(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('credentials');
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