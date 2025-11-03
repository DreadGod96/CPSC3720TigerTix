import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';
import { FaRobot, FaUser, FaPaperPlane } from 'react-icons/fa';
import VoiceInput from '../VoiceInput/VoiceInput';

const ChatBox = ({ messages, isLoading, onSendMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                className="chatbox-fab"
                onClick={() => setIsOpen(true)}
                aria-label="Open TigerTix Chatbot"
                title="Open TigerTix Chatbot"
            >
                <FaRobot />
            </button>
        );
    }

    return (
        <div className="chatbox-container">
            <div className="chatbox-header">
                <h3>TigerTix Assistant</h3>
                <button onClick={() => setIsOpen(false)} aria-label="Close Chatbox">&times;</button>
            </div>
            <div className="chatbox-messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender}`}
                        aria-label={`${msg.sender === 'bot' ? 'Chatbot' : 'User'} message: ${msg.text}`}
                    >
                        <div className="message-icon">
                            {msg.sender === 'bot' ? <FaRobot /> : <FaUser />}
                        </div>
                        <div className="message-text">{msg.text}</div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot">
                        <div className="message-icon"><FaRobot /></div>
                        <div className="message-text typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chatbox-input">
                <VoiceInput onSpeechResult={setInputValue} />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    aria-label="Chat input"
                />
                <button className="send-button" onClick={handleSend} aria-label="Send Message">
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );
}

export default ChatBox;