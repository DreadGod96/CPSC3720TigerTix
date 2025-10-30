import "./VoiceInput.css";
import React, { useState, useEffect } from 'react';
import { FaMicrophone } from 'react-icons/fa';

//Ensure browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
}
else {
    console.log("Web Speech API is not supported by this browser.");
}

//Create beep sound with Web Audio API
const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => { oscillator.stop(); }, 200);
};


const VoiceInput = ({ onSpeechResult }) => {

    //Set inital states of listening, text, and error messaging
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');

    const handleMicClick = () => {
        //Redundant verification for browser support on click
        if (!SpeechRecognition) {
            setError("The browser does not support this operation.")
            return;
        }

        //On-click, if recognition is listening, end listening
        if (isListening) {
            recognition.stop();
        }
        //Start listening: beep, reset text translation, reset error messaging
        else {
            playBeep();
            setTranscript('');
            setError('');
            recognition.start();
        }
    };

    //Setup logic, after mic is added to screen
    useEffect(() => {
        //Ensure browser compatibility
        if (!recognition) { return; }

        recognition.onStart = () => setIsListening(true);
        recognition.onEnd = () => setIsListening(false);
        recognition.onError = (event) => setError('Speech recognition error: ${event.error}');
        //After speaking, text is transcribed and passed back to app.js
        recognition.onResult = (event) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
            onSpeechResult(currentTranscript);
        };

        //Cleanup after effect use
        return () => {
            recognition.onStart = null;
            recognition.onEnd = null;
            recognition.onError = null;
            recognition.onResult = null;
        };
    },
        [onSpeechResult]);

    return (
        <div className="voice-input-container">
            <button
                className="micButton"
                onClick={handleMicClick}
                aria-label={isListening ? "Stop listening" : "Start voice command"}
            >
                <FaMicrophone color={isListening ? 'red' : 'black'} />
            </button>

            <p className="transcript-display">{transcript}</p>

            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default VoiceInput;
