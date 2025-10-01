// File: apps/backend/src/web/controllers/report.controller.ts
import { Request, Response } from 'express';
import { Report } from '../models/report.model';
import mongoose from 'mongoose';

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params; // or get all-time stats if no roomId
        const aggregationPipeline: mongoose.PipelineStage[] = [
            // Stage 1: Group by user and calculate stats
            {
                $group: {
                    _id: "$userId",
                    points: { $sum: "$points" },
                    correctAnswers: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                    totalAttempts: { $sum: 1 },
                    avgTime: { $avg: "$timeTaken" }
                }
            },
            // Stage 2: Join with users collection to get user details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            // Stage 3: Deconstruct the userDetails array
            { $unwind: { path: "$userDetails" } },
            // Stage 4: Format the output
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: "$userDetails.fullName",
                    avatar: "$userDetails.avatar",
                    points: 1,
                    accuracy: { $multiply: [{ $divide: ["$correctAnswers", "$totalAttempts"] }, 100] },
                    pollsAttempted: "$totalAttempts",
                    avgTime: { $round: ["$avgTime", 1] }
                }
            },
            // Stage 5: Sort by points
            { $sort: { points: -1 } }
        ];

        const leaderboard = await Report.aggregate(aggregationPipeline);
        res.status(200).json(leaderboard);
    } catch (error: any) {
        console.error("LEADERBOARD ERROR:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard data." });
    }
};