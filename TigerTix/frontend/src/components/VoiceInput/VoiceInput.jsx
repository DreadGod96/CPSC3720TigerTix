import "./VoiceInput.css";
import React, { useState, useEffect } from 'react';
import { FAMicrophonbe } from 'react-icons/fa';

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


    useEffect(() => {

    })
};

export default VoiceInput;
