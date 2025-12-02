import "./VoiceInput.css";
import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone } from 'react-icons/fa';

const playBeep = () => {
    if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) {
        console.warn("AudioContext not supported.");
        return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => { oscillator.stop(); }, 200);
};

const VoiceInput = ({ onSpeechResult }) => {

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');

    const recognitionRef = useRef(null);

    const onSpeechResultRef = useRef(onSpeechResult);
    useEffect(() => {
        onSpeechResultRef.current = onSpeechResult;
    }, [onSpeechResult]);

    useEffect(() => {
        // Ensure browser compatibility
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Web Speech API is not supported by this browser.");
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.interimResults = false;
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;
        }

        const recognition = recognitionRef.current;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("VoiceInput: recognition.onError", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setError("Microphone permission denied. Please allow it in your browser settings.");
            } else {
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onresult = (event) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);

            if (onSpeechResultRef.current) {
                onSpeechResultRef.current(currentTranscript);
            } else {
                console.error("VoiceInput: onSpeechResultRef.current is not a function");
            }
        };

        return () => {
            recognition.onstart = null;
            recognition.onend = null;
            recognition.onerror = null;
            recognition.onresult = null;
        };

    }, []); 

    const handleMicClick = () => {
        const recognition = recognitionRef.current;
        
        if (!recognition) {
            setError("Speech recognition is not available or initialized.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            playBeep();
            setTranscript('');
            setError('');
            try {
                recognition.start();
            } catch (error) {
                console.error("VoiceInput: Error on recognition.start()", error);
                setError(`Error starting: ${error.message}`);
            }
        }
    };

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