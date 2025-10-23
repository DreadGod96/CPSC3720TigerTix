import {GoogleGenAI} from '@google/genai';
import fs from 'node:fs';
import { parse } from 'node:path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const model = 'gemini-2.0-flash-001';


async function authenticateWithGoogle() {
    //HINT: https://docs.cloud.google.com/docs/authentication/
    // necessary to authenticate to use api key
    // choose a method on the docs and experiments
    // good luck :)

}

function cleanInput(userInput) {
    // remove any non alphanumerical characters
    // possible: send another ai request to determine if the user response is relevant
    // use a promise here: if user response invalid / inappropiate reject it
    // return string 
    return userInput;
}

function parseModelResponse(modelResponse) {
    // possible: send another ai request to determine if ai response is relevant / accurate
    // turn the ai response into json, singling out event and number of tickets to buy
    // HINT: you can define output structure in prompt.txt...

    return {event: "Jazz Night", tickets: 2}
}


export const queryChatbot = async (userInput) => {
    // this function is missing some features
    // HINT: wrap the function in a promise...
    
    userInput = userInput ? userInput : "hi";
    // take user string
    // clean input 
    // pass to api request
    // wait for api response
    // parse output
    // return json  

    //TODO: If promise is rejected, send response that request is inappropriate
    const cleanedInput = cleanInput(userInput);
    
    const prompt = await new Promise((resolve, reject) => {
        fs.readFile('./prompt.txt', 'utf-8', (error, data) => {
            if (error) {
                console.error(error);
                reject(error);
                return;
            }
            resolve(data);
            return;
        });
        
    });

    console.log(prompt);


    const modelResponse = await ai.models.generateContent({
        model: model,
        contents: cleanedInput,
        //TODO: figure out how to separate the prompt (system prompt) and the user request (prompt)
        //HINT: https://googleapis.github.io/js-genai/release_docs/index.html documentation

    }).catch((e) => {
        console.error('error name: ', e.name);
        console.error('error message: ', e.message);
        console.error('error status: ', e.status);
        //HINT: promise...
    })

    return parseModelResponse(modelResponse);
};


const Event = {
    queryChatbot
}

export default Event;