// apps/backend/src/web/controllers/sessionReport.controller.ts

import { Request, Response } from 'express';
import { SessionReport } from '../models/sessionReport.model';

import { Report } from '../models/report.model';
import mongoose from 'mongoose';

// Get all session reports for the logged-in host
export const getHostSessionReports = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        const reports = await SessionReport.find({ hostId }).sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch session reports." });
    }
};

// Get a single, detailed session report by its ID (for the host)
export const getSessionReportById = async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const hostId = (req as any).user.id;
        const report = await SessionReport.findOne({ _id: reportId, hostId });

        if (!report) {
            return res.status(404).json({ message: "Report not found or you do not have permission to view it." });
        }
        res.status(200).json(report);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch session report details." });
    }
};


// Get a report using the original session/room ID (for students)
export const getReportBySessionId = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        console.log('🔍 [SessionReport] Searching for report with sessionId:', sessionId);
        
        const report = await SessionReport.findOne({ sessionId });
        console.log('📊 [SessionReport] Found report:', !!report);
        
        if (!report) {
            console.log('❌ [SessionReport] No report found for sessionId:', sessionId);
            return res.status(404).json({ message: 'Report not found for this session.' });
        }
        
        console.log('✅ [SessionReport] Returning report data:', {
            sessionName: report.sessionName,
            studentCount: report.studentResults.length
        });
        
        res.status(200).json(report);
    } catch (error: any) {
        console.error('❌ [SessionReport] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get count of sessions the authenticated student has joined
export const getMyJoinedSessionsCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Count documents where the studentResults array contains this user
        const count = await SessionReport.countDocuments({ 'studentResults.userId': userId });
        res.status(200).json({ count });
    } catch (error: any) {
        console.error('Failed to count joined sessions:', error);
        res.status(500).json({ message: 'Failed to fetch joined sessions count.' });
    }
};


// Debug endpoint to check raw SessionReport data
export const getDebugSessionData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Get the most recent session report for this user
        const recentSession = await SessionReport.findOne({ 
            'studentResults.userId': userId 
        }).sort({ sessionEndedAt: -1 });

        if (!recentSession) {
            return res.status(404).json({ message: 'No sessions found for this user' });
        }

        const studentResult = recentSession.studentResults.find((result: any) => 
            String(result.userId) === String(userId)
        );

        res.status(200).json({
            sessionReport: {
                _id: recentSession._id,
                sessionName: recentSession.sessionName,
                sessionEndedAt: recentSession.sessionEndedAt,
                totalStudents: recentSession.studentResults.length
            },
            studentResult: studentResult,
            allStudentResults: recentSession.studentResults // To see the structure
        });
    } catch (error: any) {
        console.error('Failed to get debug session data:', error);
        res.status(500).json({ message: 'Failed to get debug data.' });
    }
};


// Get recent sessions attended by the authenticated student
export const getMyRecentSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Find session reports where this user participated
        const reports = await SessionReport.find({ 'studentResults.userId': userId })
            .sort({ sessionEndedAt: -1 })
            .limit(10)
            .lean();

        const recent = reports.map((rep: any) => {
            const studentResult = Array.isArray(rep.studentResults)
                ? rep.studentResults.find((s: any) => String(s.userId) === String(userId))
                : null;

            return {
                sessionId: rep.sessionId,
                sessionName: rep.sessionName,
                sessionEndedAt: rep.sessionEndedAt,
                studentResult: studentResult || null,
            };
        });

        res.status(200).json({ recent });
    } catch (error: any) {
        console.error('Failed to fetch recent sessions for student:', error);
        res.status(500).json({ message: 'Failed to fetch recent sessions.' });
    }
};


// Get detailed session history for a student - uses SessionReports where student participated
export const getStudentPollHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Find all SessionReports where this student participated
        const studentSessions = await SessionReport.find({ 
            'studentResults.userId': userId 
        }).sort({ sessionEndedAt: -1 }).limit(50);

        console.log('🔍 Found', studentSessions.length, 'sessions for user', userId);

        // Return raw data first to see what's in the database
        if (studentSessions.length > 0) {
            const firstSession = studentSessions[0];
            const studentResult = firstSession.studentResults.find((result: any) => 
                String(result.userId) === String(userId)
            );
            console.log('🔍 Raw SessionReport sample:', {
                sessionName: firstSession.sessionName,
                sessionId: firstSession.sessionId,
                studentResultsCount: firstSession.studentResults.length
            });
            console.log('🔍 Raw StudentResult sample:', studentResult);
        }

        // Transform the data to match the expected frontend format
        const sessionHistoryFormatted = await Promise.all(studentSessions.map(async (sessionReport: any, index: number) => {
            // Find this student's specific result in the session
            const studentResult = sessionReport.studentResults.find((result: any) => 
                String(result.userId) === String(userId)
            );

            if (!studentResult) {
                console.log('❌ No student result found for session', sessionReport._id);
                return null; // Skip if somehow student result not found
            }

            // Calculate rank within this session (if not already provided)
            let studentRank = null;
            if (sessionReport.studentResults && sessionReport.studentResults.length > 0) {
                const sortedResults = [...sessionReport.studentResults].sort((a: any, b: any) => 
                    (b.totalPoints || 0) - (a.totalPoints || 0)
                );
                studentRank = sortedResults.findIndex((result: any) => 
                    String(result.userId) === String(userId)
                ) + 1;
            }

            // Extract base subject from session name
            const extractSubject = (sessionName: string): string => {
                if (!sessionName) return 'General';
                
                // Common subject patterns and their extracted subjects
                const subjectPatterns = [
                    { pattern: /^(DSA|Data Structures?|Algorithms?|Data Structure)/i, subject: 'DSA' },
                    { pattern: /(Arrays?|LinkedList|Trees?|Graphs?|Sorting|Searching)/i, subject: 'DSA' },
                    { pattern: /^(AI|Artificial Intelligence)/i, subject: 'AI' },
                    { pattern: /^(ML|Machine Learning)/i, subject: 'ML' },
                    { pattern: /^(Data Science)/i, subject: 'Data Science' },
                    { pattern: /^(Math|Mathematics)/i, subject: 'Mathematics' },
                    { pattern: /^(Phys|Physics)/i, subject: 'Physics' },
                    { pattern: /^(Chem|Chemistry)/i, subject: 'Chemistry' },
                    { pattern: /^(Bio|Biology)/i, subject: 'Biology' },
                    { pattern: /^(CS|Computer Science|Programming)/i, subject: 'Computer Science' },
                    { pattern: /^(Eng|English)/i, subject: 'English' },
                    { pattern: /^(Hist|History)/i, subject: 'History' },
                    { pattern: /^(Geog|Geography)/i, subject: 'Geography' },
                    { pattern: /^(Econ|Economics)/i, subject: 'Economics' },
                    { pattern: /^(Psych|Psychology)/i, subject: 'Psychology' },
                ];

                // Check for patterns
                for (const { pattern, subject } of subjectPatterns) {
                    if (pattern.test(sessionName)) {
                        return subject;
                    }
                }

                // If no pattern matches, try to extract first word as subject
                const firstWord = sessionName.split(/[\s\d-_]+/)[0];
                if (firstWord && firstWord.length > 2) {
                    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
                }

                return 'General';
            };

            // Determine difficulty type based on question types in the session
            // For now, we'll check if we can get poll data, otherwise default to 'Mixed'
            const determineDifficulty = async (): Promise<string> => {
                try {
                    // Try to get polls for this session to analyze question types
                    const Poll = require('../models/poll.model').Poll;
                    const Report = require('../models/report.model').Report;
                    
                    // Get all reports for this session to find poll IDs
                    const sessionReports = await Report.find({ sessionId: sessionReport.sessionId }).distinct('pollId');
                    
                    if (sessionReports.length > 0) {
                        // Get the actual polls to check their question types
                        const polls = await Poll.find({ _id: { $in: sessionReports } });
                        
                        if (polls.length > 0) {
                            // Check if all polls are MCQ type
                            const questionTypes = polls.map((poll: any) => poll.type || poll.questionType || 'mcq').map((type: string) => type.toLowerCase());
                            const uniqueTypes = [...new Set(questionTypes)];
                            
                            // If only one type and it's MCQ, return 'MCQ'
                            if (uniqueTypes.length === 1 && (uniqueTypes[0] === 'mcq' || uniqueTypes[0] === 'multiple-choice')) {
                                return 'MCQ';
                            }
                            // If only true/false questions
                            else if (uniqueTypes.length === 1 && (uniqueTypes[0] === 'true-false' || uniqueTypes[0] === 'boolean')) {
                                return 'True/False';
                            }
                            // If mix of different question types
                            else if (uniqueTypes.length > 1) {
                                return 'Mixed';
                            }
                        }
                    }
                } catch (error) {
                    console.log('Could not determine question types, defaulting to Mixed');
                }
                return 'Mixed';
            };

            const sessionSubject = extractSubject(sessionReport.sessionName);
            const sessionDifficulty = await determineDifficulty();

            const formattedSession = {
                id: sessionReport._id,
                title: sessionReport.sessionName || 'Session',
                subject: sessionSubject,
                date: new Date(sessionReport.sessionEndedAt).toISOString().split('T')[0],
                time: new Date(sessionReport.sessionEndedAt).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                duration: `${Math.ceil(studentResult.averageTime || 0)} sec avg`,
                status: 'completed',
                score: Math.round(studentResult.accuracy || 0), // Use the accuracy field from StudentResult
                accuracy: Math.round(studentResult.accuracy || 0),
                rank: studentRank,
                totalQuestions: studentResult.totalPolls || 0, // Use totalPolls field
                correctAnswers: studentResult.correctAnswers || 0,
                points: studentResult.totalPoints || 0,
                participants: sessionReport.studentResults.length,
                difficulty: sessionDifficulty,
                sessionName: sessionReport.sessionName || 'Session',
                sessionCode: sessionReport.sessionCode || 'N/A',
                avgTimeTaken: Math.round(studentResult.averageTime || 0), // Use averageTime field
                lastActivity: sessionReport.sessionEndedAt,
                sessionDate: sessionReport.createdAt,
                // Add streak data
                currentStreak: studentResult.streak || 0,
                longestStreak: studentResult.longestStreak || 0
            };

            if (index === 0) {
                console.log('📋 Sample formatted session:', {
                    ...formattedSession,
                    streakData: {
                        currentStreak: formattedSession.currentStreak,
                        longestStreak: formattedSession.longestStreak
                    }
                });
            }

            return formattedSession;
        })).then(results => results.filter(Boolean)); // Remove null entries

        console.log('✅ Returning', sessionHistoryFormatted.length, 'formatted sessions');

        res.status(200).json({ 
            success: true,
            data: sessionHistoryFormatted,
            totalSessions: sessionHistoryFormatted.length 
        });
    } catch (error: any) {
        console.error('Failed to fetch student session history:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch session history.',
            error: error.message 
        });
    }
};