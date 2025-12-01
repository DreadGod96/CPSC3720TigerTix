import 'dotenv/config';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'path'; 

const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL || 'http://localhost:10000/api/events';

const LLM_API_KEY = process.env.LLM_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-001';
if (!LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not defined in .env");
}
const ai = new GoogleGenAI({LLM_API_KEY});


const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Cleans and validates user input.
 * @param {*} user_input The string that is entered by the user
 * @returns {Promise<string>} A promise that resolves with the cleaned string.
 */
export function cleanInput(user_input) {
    return new Promise((resolve, reject) => {
        if(typeof user_input !== 'string') {
            return reject(new Error('INVALID_INPUT_TYPE'));
        }
        if(user_input.trim() === '') {
            return reject(new Error('INVALID_INPUT_NONE'));
        }
        if(user_input.length > 256) {
            return reject(new Error('INVALID_INPUT_TOO_LONG'));
        }

        // Fancy regex to catch any code snippets
        const code_regex = /(<[^>]*>)|([{}[\];])|(`[^`]*`)/;
        if(code_regex.test(user_input)) {
            return reject(new Error('INVALID_INPUT_CODE'));
        }

        const cleaned_input = user_input.trim();
        resolve(cleaned_input);
    });
}


/**
 * TOOL: Finds events by fetching from the client-service and filtering.
 * @param {object} args The arguments for the function, expecting a `date` property.
 * @param {string} args.date The date to search for in 'YYYY-MM-DD' format.
 * @param {string} [args.event_name] The name of the event to search for.
 * @returns {Promise<string>} A promise that resolves with a JSON string of event objects.
 */
export async function findEvents({ date, event_name }) {
    try {
        const url = new URL(CLIENT_SERVICE_URL);
        const params = new URLSearchParams();

        if (date) {
            params.append('event_date', date);
        }
        if (event_name) {
            params.append('event_name', event_name);
        }
        url.search = params.toString();

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Client-service failed with status ${response.status}`);
        }
        const filtered_events = await response.json();

        if (!filtered_events || filtered_events.length === 0) {
            return JSON.stringify({ events: [], message: `No events found matching the criteria.` });
        }
        
        return JSON.stringify({ events: filtered_events });

    } catch (error) {
        console.error('[Tool Error] findEvents failed:', error);
        return JSON.stringify({ error: `Failed to fetch events from client-service: ${error.message}` });
    }
}

/**
 * TOOL: Prepares tickets for an event booking by checking availability via the client-service.
 * @param {object} args The arguments for the function.
 * @param {string} args.event_name The name of the event.
 * @param {number} args.ticket_count The number of tickets to book.
 * @returns {Promise<string>} A promise that resolves with a JSON string of a confirmation object.
 */
export async function bookTickets({ event_name, ticket_count }) {
    try {
        const response = await fetch(CLIENT_SERVICE_URL);
        if (!response.ok) {
            throw new Error(`Client-service failed with status ${response.status}`);
        }
        const all_events = await response.json();

        const event = all_events.find(e => e.event_name.toLowerCase() === event_name.toLowerCase());

        if (!event) {
            return JSON.stringify({ success: false, error: `Event '${event_name}' not found.` });
        }

        if (event.number_of_tickets_available < ticket_count) {
            return JSON.stringify({ 
                success: false, 
                error: `Sorry, only ${event.number_of_tickets_available} tickets are available for '${event_name}'.` 
            });
        }

        return JSON.stringify({
            booking_details: { 
                event_id: event.event_id, 
                event_name: event.event_name, 
                tickets_to_book: ticket_count,
                price_per_ticket: event.price_of_a_ticket,
                total_price: (event.price_of_a_ticket * ticket_count).toFixed(2)
            }
        });

    } catch (error) {
        console.error('[Tool Error] bookTickets failed:', error);
        return JSON.stringify({ error: `Failed to prepare booking: ${error.message}` });
    }
}

const tools = {
    findEvents,
    bookTickets,
};

// Providing function declarations is imperative for Gemini to understand when to call it
const TOOL_DECLARATIONS = [
    {
        functionDeclarations: [
            {
                name: 'findEvents',
                description: 'Finds available events. Can filter by a specific date or by the name of the event. Use this for user queries like "what events are on friday?" or "do you have a movie night?".',
                parameters: {
                    type: "OBJECT",
                    properties: {
                        date: {
                            type: "STRING",
                            description: 'A specific date to search for events, in YYYY-MM-DD format. Optional.',
                        },
                        event_name: {
                            type: "STRING",
                            description: "The name or partial name of an event to search for. Optional."
                        },
                    },
                    required: [], 
                },
            },
            {
                name: 'bookTickets',
                description: 'Prepares a booking for a specified number of tickets for a given event.',
                parameters: {
                    type: "OBJECT",
                    properties: {
                        event_name: {
                            type: "STRING",
                            description: 'The name of the event to book tickets for.',
                        },
                        ticket_count: {
                            type: "NUMBER",
                            description: 'The number of tickets to book.',
                        },
                    },
                    required: ['event_name', 'ticket_count'],
                },
            },
        ],
    },
];

/**
 * Manages the entire conversation flow with the user.
 *
 * @param {string} user_input The latest message from the user.
 * @param {Array<object>} conversation_history An array of previous messages to maintain context.
 * @returns {Promise<object>} A promise that resolves with the chatbot's final response and the updated history.
 */
export async function manageConversation(user_input, conversation_history = []) {
    try {
        const cleaned_input = await cleanInput(user_input);
        const today = new Date().toISOString().slice(0, 10);
        
        const promptPath = path.resolve('prompt.txt');
        let system_prompt_template;
        try {
            system_prompt_template = await fs.readFile(promptPath, 'utf-8');
        }
        catch (error) {
            console.error(`Error: Could not find prompt.txt at ${promptPath}`);
            const system_prompt_template = "You are a helpful assistant for TigerTix. Today is {{current_date}}.";
        }
        const system_prompt = system_prompt_template.replace('{{current_date}}', today);


        const chat = ai.chats.create({
            model: GEMINI_MODEL,
            config: {
                temperature: 0.5,
                maxOutputTokens: 512,
                safetySettings: SAFETY_SETTINGS,
                systemInstruction: system_prompt,
                tools: [
                    {
                        functionDeclarations: [TOOL_DECLARATIONS[0].functionDeclarations]
                    }
                ],
                candidateCount: 1,
            }
        });

        // Send user response to Gemini
        const response = await chat.sendMessage({
            message: [cleaned_input]
        });

        // Gemini chooses if a function call (and which) is necessary for user request
        const tool_call = response.functionCalls?.[0];

        if (tool_call) {
            
            // Call the function necessary to handle user request
            const tool_result = await tools[tool_call.name](tool_call.args);

            const tool_function_response = {
                name: tool_call.name,
                response: { tool_result }
            }

            // Get the model's final text response and the updated history
            const final_response_object = await chat.sendMessage({
                message: [
                    cleaned_input, 
                    {
                        functionResponse: tool_function_response
                    }
                ]
            });

            if (final_response_object.candidates[0].finishReason === 'SAFETY') {
                throw new Error('MODEL_RESPONSE_BLOCKED');
            }

            const final_response_part = final_response_object.candidates.at(0).content.parts.at(0);

            const updated_chat_history = await chat.getHistory();
            const booking_details = tool_function_response.response.tool_result ? 
                JSON.parse(tool_function_response.response.tool_result).booking_details : null;

            return { 
                response: final_response_part, 
                history: updated_chat_history,
                booking_details: booking_details,
            };

        } else {

            // If no tool is called, return the model's text response
            let final_response_part;

            try {
                if (!response.candidates || response.candidates.length === 0 || response.candidates[0].finishReason === 'SAFETY') {
                    throw new Error('MODEL_RESPONSE_BLOCKED');
                }

                // Get the response Part object
                final_response_part = response.candidates[0].content.parts[0];

                // Check if the part is empty or not text
                if (!final_response_part || typeof final_response_part.text === 'undefined') {
                     throw new Error('INVALID_MODEL_RESPONSE');
                }
            } catch (e) {
                
                console.error("Could not get text from model response:", e);
                throw new Error('MODEL_RESPONSE_BLOCKED');
            }

            const updated_chat_history = await chat.getHistory();
            return {
                response: final_response_part,
                history: updated_chat_history,
                booking_details: null,
            };
        }

    } catch (error) {
        // Re-throw specific input errors so the controller can handle them
        if (error.message.startsWith('INVALID_INPUT')) {
            throw error;
        }
        // For other errors, log them and throw a generic server error
        console.error("Error in manageConversation:", error.message);
        throw new Error('LLM_SERVICE_ERROR');
    }
}

export default {
    manageConversation
};
