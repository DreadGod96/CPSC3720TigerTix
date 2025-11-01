import Event from "../models/llmModel.js"
import queueService from "../services/queueService.js";

export const getChatbotResponse = async (request, response) => {
    // For a POST request, data should be in the body
    const { user_input, chat_history } = request.body;

    try {
        const createTask = () => Event.manageConversation(user_input, chat_history);
        const model_response = await queueService.addToQueue(createTask);

        response.status(200).json({
            message: "Chatbot request successful.",
            success: true,
            model_response: model_response.response ? model_response.response : null,
            chat_history: model_response.history ? model_response.history : null,
            booking_details: model_response.booking_details ? model_response.booking_details : null,
        })
    } catch (error) {
        
        console.error(error);
        response.status(500).json({
            error: "Chatbot request failed."
        });
    }
}