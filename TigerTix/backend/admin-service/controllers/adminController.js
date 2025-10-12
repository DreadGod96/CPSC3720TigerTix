import Event from "../models/adminModel.js"
import queueService from "../services/queueService.js";

/**
 * Handles creation of a new event based on the body of request recieved
 * On success, sends a 201 status and new event data
 * On validation failure, sends a 400 status and a message explaing the validation error
 * @route POST /api/events
 * @param {object} req Express request object
 * @param {string} req.body.event_name Name of the event
 * @param {string} req.body.event_date Date of the event
 * @param {number} req.body.number_of_tickets_available Number of tickets for an event
 * @param {number} req.body.price_of_a_ticket Price of a singular ticket for an event
 * @param {object} res Express response object, sends response back to client
 */
export const createEvent = async (req, res) => {
    try {
        const createTask = () => Event.create(req.body);
        const event = await queueService.addToQueue(createTask);

        res.status(201).json({
            succces: true,
            data: event
        });
    } catch (error) {
        console.error("Error creating event:", error);
        if (error.name === 'ValidationError'){
            return res.status(400).json({
                success: false,
                message: "Input data is invalid. Please make sure all necessary data is provided"
            })
        }

        res.status(500).json({
            success: false,
            message: "Server error: Could not create the event"
        })
    }
}



