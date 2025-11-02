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

    beforeEach(() => {
        mockOnSpeechResult.mockClear();
        mockSpeechRecognition.mockClear();
        const mockInstance = mockSpeechRecognition.mock.results[0]?.value;
        if (mockInstance) Object.values(mockInstance).forEach(mockFn => mockFn.mockClear());
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
        const recognitionInstance = mockSpeechRecognition.mock.results[0].value;
        expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
    });

    test('displays transcript and calls onSpeechResult when recognition has a result', () => {
        render(<VoiceInput onSpeechResult={mockOnSpeechResult} />);
        const recognitionInstance = mockSpeechRecognition.mock.results[0].value;
        expect(recognitionInstance).toBeDefined();

        recognitionInstance.onresult({ results: [[{ transcript: 'hello world' }]] });

        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(mockOnSpeechResult).toHaveBeenCalledWith('hello world');
    });
});
