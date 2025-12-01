import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInput from './VoiceInput.jsx';

// 1. Create a global "Singleton" object for the mock.
// This ensures 'recognitionInstance' is NEVER undefined.
const recognitionInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onstart: null,
    onend: null,
    onresult: null, // Component will overwrite this
    onerror: null,
};

// 2. Create the Mock Constructor that returns our Singleton
const MockSpeechRecognition = jest.fn(() => recognitionInstance);

// 3. Attach to the global window object (safely)
Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
});

// 4. Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: jest.fn(() => ({
        createOscillator: () => ({
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            type: '',
            frequency: { setValueAtTime: jest.fn() },
        }),
        currentTime: 0,
    })),
});

describe('VoiceInput', () => {
    const mockOnSpeechResult = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset the singleton's state before every test
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

        // Use waitFor to allow the component to process the click
        await waitFor(() => {
            expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
        });
    });

    test('displays transcript and calls onSpeechResult when recognition has a result', async () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);

        const micButton = screen.getByRole('button', { name: /start voice command/i });
        fireEvent.click(micButton);

        // Wait for the component to attach the 'onresult' listener
        await waitFor(() => {
            expect(typeof recognitionInstance.onresult).toBe('function');
        });

        // Manually trigger the result event
        recognitionInstance.onresult({ 
            results: [[{ transcript: 'hello world' }]] 
        });

        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(mockOnSpeechResult).toHaveBeenCalledWith('hello world');
    });
});