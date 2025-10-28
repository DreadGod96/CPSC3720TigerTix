import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ GEMINI_API_KEY });
const gemini_model = 'gemini-2.0-flash-001';

/**
 * Cleans and validates user input, removing nonalphanumeric characters
 * @param {*} userInput the string that is entered by the user
 * @returns {Promise<string>} A promise that resolves with the cleaned string OR
 * rejects with an error message if the input is invalid.
 */
function cleanInput(userInput) {
    return new Promise((resolve, reject) => {
        // use a promise here: if user response invalid / inappropiate reject it
        //non-string:
        if (typeof userInput !== 'string') {
            return reject(new Error('Input must be a string.'));
        }
        //empty string:
        if (userInput.trim() === '') {
            return reject(new Error('No input was entered'));
        }

        // remove any non alphanumerical characters
        const cleanedStr = userInput.trim().replace(/[^a-z0-9\s]/gmi, '');
        //No valid characters rejection:
        if (cleanedStr === '') {
            return reject(new Error('No valid characters were input'));
        }

        // return string
        resolve(cleanedStr);
    });
}

/**
 * Parses the text response from the LLM into a JSON object
 * @param {string} modelResponse the text string from the AI
 * @returns {object} a JSON object
 */
function parseModelResponse(modelResponse) {
    try {
        //Remove markdown wrapper
        const jsonString = modelResponse.replace(/```json\n|```/g, '');
        const parsedJson = JSON.parse(jsonString);
        //Validate data types and structure, if valid, return
        if (parsedJson.event && typeof parsedJson.tickets === 'number') {
            return parsedJson;
        }
        else {
            console.error("Parsed response is missing a data field.");
            return null;
        }
    }
    catch (error) {
        console.error("Failed to parse the LLM response as JSON: ");
        return null;
    }
}


export const queryChatbot = async (userInput) => {
    console.log("queryChatbot started");

    try {
        const cleanedInput = await cleanInput(userInput || "hi");
        console.log("1.Input Cleaned");
        console.log("2. Reading prompt.txt");
        const systemPrompt = await fs.readFile('./prompt.txt', 'utf-8');
        console.log("4. Sending request to Gemini API");

        const result = await ai.models.generateContent({
            model: gemini_model,    
            contents: cleanedInput,
            config: {
                systemInstruction: systemPrompt,
                candidateCount: 1,
            }
        });

        const modelResponse = result.candidates.at(0).content.parts;
        console.log(modelResponse);
        console.log("5. Received API response");

        return parseModelResponse(modelResponse);
    }
    catch (error) {
        console.error("Error in queryChatbot Function:", error.message);
        throw new Error("Failed to process the chatbot request.");
    }
};

const Event = {
    queryChatbot
}

export default Event;