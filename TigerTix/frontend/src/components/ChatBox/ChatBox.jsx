import React, { useState, useEffect, useRef } from 'react';
import "./ChatBox.css";
import { FaPaperPlane } from 'react-icons/fa';

export default function ChatBox({ messages, onSendMessage, isLoading }) {
    const [userInput, setUserInput] = useState("");
    const messageListRef = useRef(null);

    useEffect(() => {
        if (messageListRef.current){
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (userInput.trim()) {
            onSendMessage(userInput);
            setUserInput("");
        }
    };

    return (
    <div className="chat-container">
            <div className="message-list" ref={messageListRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot">
                        ...
                    </div>
                )}
            </div>
            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    aria-label="Chat message"
                />
                <button type="submit" aria-label="Send message">
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
}