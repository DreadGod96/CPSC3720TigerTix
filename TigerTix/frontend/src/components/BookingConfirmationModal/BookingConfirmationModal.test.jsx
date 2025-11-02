import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingConfirmationModal from './BookingConfirmationModal.jsx';

describe('BookingConfirmationModal', () => {
    const mockDetails = {
        event_name: 'Jazz Night',
        tickets_to_book: 2,
        price_per_ticket: 25,
        total_price: 50,
    };

    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    test('renders nothing when isOpen is false', () => {
        render(
            <BookingConfirmationModal
                isOpen={false}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                details={mockDetails}
            />
        );
        // The component should return null, so the main title shouldn't be in the document.
        expect(screen.queryByText('Confirm Your Booking')).not.toBeInTheDocument();
    });

    test('renders correctly when isOpen is true with details', () => {
        render(
            <BookingConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                details={mockDetails}
            />
        );

        expect(screen.getByText('Confirm Your Booking')).toBeInTheDocument();
        expect(screen.getByText('Jazz Night')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('$50')).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        const cancelButton = screen.getByRole('button', { name: /cancel/i });

        fireEvent.click(confirmButton);
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
