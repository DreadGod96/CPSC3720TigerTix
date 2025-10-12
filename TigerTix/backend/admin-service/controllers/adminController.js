import Event from "../models/adminModel.js"

export const createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);
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



