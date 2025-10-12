import Event from "../models/clientModel.js";
import queueService from "../services/queueService.js";

//Handler for GET /api/events
export const getEvents = async (req, res) => {
    try {
        const createTask = () => Event.findAllEvents(req.body);
        const events = await queueService.addToQueue(createTask);
        res.status(200).json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Failed to retrieve events.'
        });
    }
};

//Handler for POST /api/events/:id/purchase
export const purchaseTicket = async (req, res) => {
    const eventId = parseInt(req.params.id);

    //Validate event id input
    if (isNaN(eventId) || eventId <= 0) {
        return res.status(400).json({
            error: 'Invalid Event ID.'
        });
    }

    try {
        const createTask = () => Event.purchaseTicket(eventId);
        const event = await queueService.addToQueue(createTask);
        //const newTicketCount = event.number_of_available_tickets;

        res.status(200).json({
            message: 'Ticket purchase successful.',
            event_id: eventId,
            new_available_tickets: 1 
        });
    }
    catch (error) {
        console.error(`Purchase error for event ${eventId}:`, error.message);

        //Handle model errors
        switch (error.message) {
            //404 error
            case 'NOT_FOUND':
                return res.status(404).json({ message: `Event with ID ${eventId} not found.` });

            //400 error
            case 'NO_TICKETS':
                return res.status(400).json({ message: 'Purchase failed: No tickets available.' });

            //500 error
            case 'DB_CHECK_ERROR':
            case 'DB_UPDATE_ERROR':
            case 'COMMIT_ERROR':
                return res.status(500).json({ error: 'A database error occured during ticket purchase.' });
            //Any other 500 error
            default:
                return res.status(500).json({ error: 'An unknown server error occurred.' });
        }
    }
};