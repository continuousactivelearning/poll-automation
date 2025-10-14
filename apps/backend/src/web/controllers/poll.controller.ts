
// File: apps/backend/src/web/controllers/poll.controller.ts
import { Request, Response } from 'express';
import { Poll } from '../models/poll.model';
import mongoose from 'mongoose';
export const createPoll = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
   const { title, type, options, correctAnswer, timerDuration, sessionId } = req.body;
        // Validate required fields
        if (!title || !type || !options || !correctAnswer || !sessionId) {
            return res.status(400).json({ message: "Missing required fields, including sessionId" });
        }
        // Validate type
        if (!['mcq', 'truefalse'].includes(type)) {
            return res.status(400).json({ 
                message: "Invalid poll type. Must be 'mcq' or 'truefalse'" 
            });
        }

        // Validate options (must be array of strings)
        if (!Array.isArray(options) || options.some(opt => typeof opt !== 'string')) {
            return res.status(400).json({ 
                message: "Options must be an array of strings" 
            });
        }

        // Validate at least 2 options for MCQ
        if (type === 'mcq' && options.length < 2) {
            return res.status(400).json({ 
                message: "At least 2 options are required for MCQ polls" 
            });
        }

        const newPoll = new Poll({
            hostId,
           sessionId, // --- NEW: Save the sessionId ---
            title,
            type,
            options, // Directly use the array of strings
            correctAnswer,
            timerDuration
        });
        
        await newPoll.save();
        res.status(201).json({ 
            message: "Poll created successfully!", 
            poll: newPoll 
        });
    } catch (error: any) {
        console.error("CREATE POLL ERROR:", error);
        res.status(400).json({ 
            message: error.message || "Failed to create poll",
            errors: error.errors 
        });
    }
};

export const getHostPolls = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        // --- NEW: Get sessionId from the query parameters ---
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ message: "A sessionId is required to fetch polls." });
        }

        // --- MODIFIED: Filter by both hostId AND sessionId ---
        const polls = await Poll.find({ 
            hostId: hostId,
            sessionId: sessionId 
        }).sort({ createdAt: -1 });
        
        res.status(200).json(polls);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// export const getHostPolls = async (req: Request, res: Response) => {
//     try {
//         const hostId = (req as any).user.id;
//         const polls = await Poll.find({ hostId }).sort({ createdAt: -1 });
//         res.status(200).json(polls);
//     } catch (error: any) {
//         res.status(500).json({ message: error.message });
//     }
// };