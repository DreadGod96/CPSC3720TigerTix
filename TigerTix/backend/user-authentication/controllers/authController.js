import AuthModel from "../models/authModel.js";
import queueService from "../services/queueService.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        //validate that email and password are entered
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        //Check for prior username existence
        const findUserTask = () => AuthModel.findUser(email);
        const existingUser = await queueService.addToQueue(findUserTask);

        if (existingUser) {
            return res.status(409).json({
                success:false, message: 'Email already in use'
            });
        }

        //Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10)

        //Store user data in database
        const createUserData = {
            email: email,
            password: hashedPassword
        };
        const createUserTask = () => AuthModel.createUser(createUserData);
        const newUser = await queueService.addToQueue(createUserTask);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: newUser.id
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const {email, password } = req.body;

        //validate that email and password are entered
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        //Check for prior username existence
        const findUserTask = () => AuthModel.findUser(email);
        const existingUser = await queueService.addToQueue(findUserTask);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        //compare provided password with stored hashed password
        const matchingPass = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        //Create JWT and assign to a user
        const token = jwt.sign({ userId: user.user_id, email: user.email },
            JWT_SECRET, { expiresIn: '30m' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};