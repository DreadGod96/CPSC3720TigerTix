import Event from "../models/adminModel.js"
import queueService from "../services/queueService.js";

/**
 * Handles creation of a new event based on the body of request received
 * On success, sends a 201 status and new event data
 * On validation failure, sends a 400 status and a message explaining the validation error
 * @route POST /api/events
 * @param {object} request Express request object
 * @param {string} request.body.event_name Name of the event
 * @param {string} request.body.event_date Date of the event
 * @param {number} request.body.number_of_tickets_available Number of tickets for an event
 * @param {number} request.body.price_of_a_ticket Price of a singular ticket for an event
 * @param {object} response Express response object, sends response back to client
 */
export const createEvent = async (request, response) => {
    try {
        const createTask = () => Event.create(request.body);
        const event = await queueService.addToQueue(createTask);

        response.status(201).json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error("Error creating event:", error);

        if (error.code === 'VALIDATION_ERROR'){
            return response.status(400).json({
                success: false,
                message: error.message
            })
        }

        response.status(500).json({
            success: false,
            message: "Server error: Could not create the event"
        })
    }
}



