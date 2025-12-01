import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInput from './VoiceInput.jsx';

// define instance object
const recognitionInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onstart: jest.fn(),
    onend: jest.fn(),
    onresult: null,
    onerror: jest.fn(),
};

// Mock SpeechRecognition API
const mockSpeechRecognition = jest.fn(() => recognitionInstance);

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

    beforeEach(() => {
        jest.clearAllMocks();

        recognitionInstance.start.mockClear();
        recognitionInstance.stop.mockClear();
        recognitionInstance.onresult = null;

    });

    test('renders the microphone button', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        const micButton = screen.getByRole('button', { name: /start voice command/i });
        expect(micButton).toBeInTheDocument();
    });

    test('clicking the mic button starts recognition', async () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        const micButton = screen.getByRole('button', { name: /start voice command/i });
        fireEvent.click(micButton);

        await waitFor(() => {
            expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
        });
    });

    test('displays transcript and calls onSpeechResult when recognition has a result', async () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);

        const micButton = screen.getByRole('button', { name: /start voice command/i });
        fireEvent.click(micButton);

        await waitFor(() => {
            expect(typeof recognitionInstance.onresult).toBe('function');
        });

        recognitionInstance.onresult({ results: [[{ transcript: 'hello world' }]] });

        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(mockOnSpeechResult).toHaveBeenCalledWith('hello world');
    });
});
