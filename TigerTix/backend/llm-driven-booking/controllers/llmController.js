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
        let statusCode = 500;
        let errorMessage = "An unexpected error occurred with the chatbot service.";

        switch (error.message) {
            case 'INVALID_INPUT_TYPE':
            case 'INVALID_INPUT_NONE':
            case 'INVALID_INPUT_TOO_LONG':
                statusCode = 400; 
                errorMessage = "Your input was invalid. Please provide a valid text message.";
                break;
            
            case 'INVALID_INPUT_CODE':
                statusCode = 400; 
                errorMessage = "Your input appears to contain code or special characters, which is not allowed.";
                break;

            case 'MODEL_RESPONSE_BLOCKED':
                statusCode = 503; 
                errorMessage = "I'm sorry, but I can't provide a response to that. It may have violated our safety policies. Please try rephrasing your message.";
                break;

            case 'LLM_SERVICE_ERROR':
            default:
                statusCode = 500; 
                errorMessage = "The chatbot service is currently experiencing issues. Please try again later.";
                break;
        }
        console.error(`Chatbot Error: ${error.message}`);
        response.status(statusCode).json({ error: errorMessage });
    }
}