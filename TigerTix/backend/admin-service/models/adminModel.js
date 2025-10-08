//import { Request, Response, NextFunction } from "express";

export const sendHelloWorld = async (request, response, next) => {
    try {
        response.send("Hello World");
    } catch (error) {
        console.log(error);
    }
    
}