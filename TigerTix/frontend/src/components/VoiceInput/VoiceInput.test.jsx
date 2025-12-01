import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInput from './VoiceInput.jsx';

// Mock SpeechRecognition API
const mockSpeechRecognition = jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    onstart: jest.fn(),
    onend: jest.fn(),
    onresult: jest.fn(),
    onerror: jest.fn(),
}));

global.window.SpeechRecognition = mockSpeechRecognition;
global.window.webkitSpeechRecognition = mockSpeechRecognition;

// Mock AudioContext for beep sound
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

    const recognitionInstance = mockSpeechRecognition.mock.results[0]?.value;

    beforeEach(() => {
        mockOnSpeechResult.mockClear();

        if (recognitionInstance) {
            recognitionInstance.start.mockClear();
            recognitionInstance.stop.mockClear();
        }
    });

    test('renders the microphone button', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        const micButton = screen.getByRole('button', { name: /start voice command/i });
        expect(micButton).toBeInTheDocument();
    });

    test('clicking the mic button starts recognition', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        const micButton = screen.getByRole('button', { name: /start voice command/i });
        fireEvent.click(micButton);

        expect(recognitionInstance).toBeDefined();
        expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
    });

    test('displays transcript and calls onSpeechResult when recognition has a result', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);

        expect(recognitionInstance).toBeDefined();
        expect(recognitionInstance.onresult).toBeInstanceOf(Function);

        recognitionInstance.onresult({ results: [[{ transcript: 'hello world' }]] });

        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(mockOnSpeechResult).toHaveBeenCalledWith('hello world');
    });
});