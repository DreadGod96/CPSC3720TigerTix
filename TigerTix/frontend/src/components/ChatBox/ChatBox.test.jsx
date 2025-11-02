import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBox from './ChatBox.jsx';

// Mock VoiceInput component to isolate ChatBox and avoid browser API dependencies.
jest.mock('../VoiceInput/VoiceInput', () => {
    // The mock component will call onSpeechResult when its button is clicked.
    return ({ onSpeechResult }) => (
        <div data-testid="mock-voice-input">
            <button onClick={() => onSpeechResult('test from voice')}>
                Mock Voice Input
            </button>
        </div>
    );
});

describe('ChatBox', () => {
    const mockMessages = [
        { sender: 'bot', text: 'Hello there!' },
        { sender: 'user', text: 'Hi bot!' }
    ];
    const mockOnSendMessage = jest.fn();

    beforeEach(() => {
        // Reset mocks before each test
        mockOnSendMessage.mockClear();
    });

    test('renders FAB by default and opens chatbox on click', () => {
        render(<ChatBox messages={[]} isLoading={false} onSendMessage={mockOnSendMessage} />);

        // Fab should be visible at first
        const fab = screen.getByRole('button', { name: /open tigerTix chatbot/i });
        expect(fab).toBeInTheDocument();
        expect(screen.queryByText('TigerTix Assistant')).not.toBeInTheDocument();

        // Click the Fab to open the chat
        fireEvent.click(fab);

        expect(screen.getByText('TigerTix Assistant')).toBeInTheDocument();
        expect(fab).not.toBeInTheDocument();
    });

    test('displays messages and loading indicator', () => {
        render(<ChatBox messages={mockMessages} isLoading={true} onSendMessage={mockOnSendMessage} />);
        
        // Open the chatbox to see the content
        fireEvent.click(screen.getByRole('button', { name: /open tigerTix chatbot/i }));

        expect(screen.getByText('Hello there!')).toBeInTheDocument();
        expect(screen.getByText('Hi bot!')).toBeInTheDocument();
        
        const loadingIndicator = document.querySelector('.typing-indicator');
        expect(loadingIndicator).toBeInTheDocument();
    });

    test('allows user to type and send a message', () => {
        render(<ChatBox messages={[]} isLoading={false} onSendMessage={mockOnSendMessage} />);
        fireEvent.click(screen.getByRole('button', { name: /open tigerTix chatbot/i }));

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /send message/i });

        // Type into the input field
        fireEvent.change(input, { target: { value: 'New message' } });
        expect(input.value).toBe('New message');

        fireEvent.click(sendButton);

        expect(mockOnSendMessage).toHaveBeenCalledWith('New message');
        expect(input.value).toBe('');
    });

    test('updates input from mocked VoiceInput', () => {
        render(<ChatBox messages={[]} isLoading={false} onSendMessage={mockOnSendMessage} />);
        fireEvent.click(screen.getByRole('button', { name: /open tigerTix chatbot/i }));

        const input = screen.getByPlaceholderText('Type a message...');
        expect(input.value).toBe('');

        // Find the button inside our mock component and click it
        const mockVoiceButton = screen.getByText('Mock Voice Input');
        fireEvent.click(mockVoiceButton);

        expect(input.value).toBe('test from voice');
    });
});