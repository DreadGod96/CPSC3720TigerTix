import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInput from './VoiceInput.jsx';

let mockRecognitionInstance = null;

// mock for the SpeechRecognition
const mockSpeechRecognition = jest.fn(function () {
    const instance = {
        start: jest.fn(),
        stop: jest.fn(),
        onstart: null,
        onend: null,
        onresult: null,
        onerror: null,
        interimResults: false,
        continuous: false,
        lang: '',
        maxAlternatives: 1,
    };
    mockRecognitionInstance = instance;
    return instance;
});

global.window.SpeechRecognition = mockSpeechRecognition;
global.window.webkitSpeechRecognition = mockSpeechRecognition;

global.window.AudioContext = jest.fn(() => ({
    createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        type: '',
        frequency: { setValueAtTime: jest.fn() },
    }),
    currentTime: 0,
}));

describe('VoiceInput', () => {
    const mockOnSpeechResult = jest.fn();

    beforeEach(() => {
        // Reset mocks before each test
        mockSpeechRecognition.mockClear();
        mockOnSpeechResult.mockClear();
        mockRecognitionInstance = null;
    });

    test('renders the microphone button', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        expect(screen.getByRole('button', { name: /start voice command/i })).toBeInTheDocument();
    });
});