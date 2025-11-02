import "./VoiceInput.css";
import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone } from 'react-icons/fa';

//Ensure browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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

let recognition;
if (SpeechRecognition){
    recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    console.log("VoiceInput: Global singleton recognition object created.");
}
else{
    console.log("VoiceInput: No SpeechRecognition support.");
}
const VoiceInput = ({ onSpeechResult }) => {

    //Set inital states of listening, text, and error messaging
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');

    const onSpeechResultRef = useRef(onSpeechResult);
    useEffect(() => {
        onSpeechResultRef.current = onSpeechResult;
    }, [onSpeechResult]);

    useEffect(() => {
        if (!recognition) {
            setError("Web Speech API is not supported by this browser.");
            return;
        }

        console.log("VoiceInput: useEffect Attaching handlers to global object");

        recognition.onstart = () => {
            console.log("VoiceInput: recognition.onStart (Listening...)");
            setIsListening(true);
        };

        recognition.onend = () => {
            console.log("VoiceInput: recognition.onEnd (Stopped listening)");
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
            console.log("VoiceInput: recognition.onResult (Got transcript)");
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);

            // Call the function from the ref
            if (onSpeechResultRef.current) {
                onSpeechResultRef.current(currentTranscript);
            } else {
                console.error("VoiceInput: onSpeechResultRef.current is not a function");
            }
        };

        // Cleanup function: We ONLY detach handlers.
        // We NEVER destroy the recognition object.
        return () => {
            console.log("VoiceInput: useEffect cleanup (detaching handlers)");
            recognition.onstart = null;
            recognition.onend = null;
            recognition.onerror = null;
            recognition.onresult = null;
        };

    // ** EMPTY dependency array. **
    // This hook runs ONCE per component mount and never again.
    }, []);

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
            try{
                recognition.start();
            } catch (error){
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
