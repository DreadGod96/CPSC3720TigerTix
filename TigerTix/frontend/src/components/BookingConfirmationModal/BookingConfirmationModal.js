import React from 'react';
import './BookingConfirmationModal.css';

const BookingConfirmationModal = ({ isOpen, onClose, onConfirm, details }) => {
    if (!isOpen || !details) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Your Booking</h2>
                <p>Please review the details below before confirming your purchase.</p>
                <div className="booking-details">
                    <p><strong>Event:</strong> {details.event_name}</p>
                    <p><strong>Tickets:</strong> {details.tickets_to_book}</p>
                    <p><strong>Price per Ticket:</strong> ${details.price_per_ticket}</p>
                    <p><strong>Total Price:</strong> ${details.total_price}</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="confirm-button">Confirm</button>
                    <button onClick={onClose} className="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmationModal;
