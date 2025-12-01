import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceInput from './VoiceInput.jsx';

// --- GLOBAL MOCK SETUP ---

// 1. Create the Mock Instance
const recognitionInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onstart: null,
    onend: null,
    onresult: null,
    onerror: null,
};

// 2. Define the Constructor
const MockSpeechRecognition = jest.fn(() => recognitionInstance);

// 3. Force it onto the window object immediately
Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
});
Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
});

// 4. Mock AudioContext (Simple version)
window.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        type: '',
        frequency: { setValueAtTime: jest.fn() },
    }),
    currentTime: 0,
}));

// -------------------------

describe('VoiceInput', () => {
    const mockOnSpeechResult = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset the instance methods/properties for a clean slate
        recognitionInstance.start.mockClear();
        recognitionInstance.stop.mockClear();
        recognitionInstance.onresult = null; 
    });

    test('renders the microphone button', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        
        // Verify the error message is NOT present
        const errorMsg = screen.queryByText(/Speech recognition is not available/i);
        expect(errorMsg).not.toBeInTheDocument();

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

        // Wait for the component to attach the listener
        await waitFor(() => {
            // We verify it's assigned (not null)
            expect(recognitionInstance.onresult).not.toBeNull();
        });

        // Manually trigger the result
        recognitionInstance.onresult({ 
            results: [[{ transcript: 'hello world' }]] 
        });

        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(mockOnSpeechResult).toHaveBeenCalledWith('hello world');
    });
});