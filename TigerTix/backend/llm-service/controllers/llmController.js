import Event from "../models/llmModel.js"
import queueService from "../services/queueService.js";

export const getChatbotResponse = async (request, response) => {
    const userInput = request.params.user_input;
    
    try {
        const createTask = () => Event.queryChatbot(userInput);
        const model_response = await queueService.addToQueue(createTask);

        response.status(200).json({
            message: "Chatbot request successful.",
            success: true,
            model_response: model_response
        })
    } catch (error) {
        
        console.error(error);
        response.status(500).json({
            error: "Chatbot request failed."
        });
    }
}