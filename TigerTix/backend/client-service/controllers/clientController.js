import Event from "../models/clientModel.js";
import queueService from "../services/queueService.js";

/**
 * Handles request for retrieving all events from the database
 * On success, responds with a 200 status and a JSON array of events, filtered by query parameters if provided.
 * On failure, responds with a 500 status and error message
 * @route GET api/events
 * @param {object} request Express request object
 * @param {object} response Express response object, sends response back to client
 */
export const getEvents = async (request, response) => {
    try {
        
        const filters = request.query;
        const createTask = () => Event.findMatchingEvents(filters);
        const events = await queueService.addToQueue(createTask);
        response.status(200).json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        response.status(500).json({
            error: 'Failed to retrieve events.'
        });
    }
};

/**
 * Handles request of 'purchasing' a single ticket for an event. Validates with eventId before running
 * the purchaseTicket function.
 * On success, responds with 200 status code
 * On failure, responds with the appropriate 400 or 500 level status and a unique error message for the
 * specific error
 * @route POST /api/events/:id/purchase
 * @param {object} request Express request object
 * @param {object} request.param The requests parameters
 * @param {string} request.param.id The ID of the event that the ticket is being bought for
 * @param {object} response Express response object, sends response back to client
 */
export const purchaseTicket = async (request, response) => {
    const eventId = parseInt(request.params.id);

    //Validate event id input
    if (isNaN(eventId) || eventId <= 0) {
        return response.status(400).json({
            error: 'Invalid Event ID.'
        });
    }

    try {
        const createTask = () => Event.purchaseTicket(eventId);
        const event = await queueService.addToQueue(createTask);

        response.status(200).json({
            message: 'Ticket purchase successful.',
            success: true,
            event_id: eventId
        });
    }
    catch (error) {
        console.error(`Purchase error for event ${eventId}:`, error.message);

        //Handle model errors
        switch (error.message) {
            //404 error
            case 'NOT_FOUND':
                return response.status(404).json({ error: `Event with ID ${eventId} not found.` });

            //400 error
            case 'NO_TICKETS':
                return response.status(400).json({ error: 'Purchase failed: No tickets available.' });

            //500 error
            case 'DB_CHECK_ERROR':
            case 'DB_UPDATE_ERROR':
            case 'COMMIT_ERROR':
                return response.status(500).json({ error: 'A database error occurred during ticket purchase.' });

            //Any other 500 error
            default:
                return response.status(500).json({ error: 'An unknown server error occurred.' });
        }
    }
};