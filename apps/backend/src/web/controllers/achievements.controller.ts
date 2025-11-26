// apps/backend/src/web/controllers/achievements.controller.ts

import { Request, Response } from 'express';
import { SessionReport } from '../models/sessionReport.model';
import { Report } from '../models/report.model';
import mongoose from 'mongoose';

interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: 'participation' | 'performance' | 'speed' | 'streak' | 'knowledge' | 'consistency';
    earned: boolean;
    progress: number;
    maxProgress: number;
    points: number;
    earnedDate?: string;
    requirements: string[];
}

// Define all available achievements with their unlock conditions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'earned' | 'progress' | 'earnedDate'>[] = [
    // PARTICIPATION ACHIEVEMENTS
    {
        id: 1,
        name: "First Steps",
        description: "Complete your first session",
        icon: "🎯",
        rarity: "common",
        category: "participation",
        maxProgress: 1,
        points: 50,
        requirements: ["Complete 1 session"]
    },
    {
        id: 2, 
        name: "Regular Participant",
        description: "Complete 10 sessions",
        icon: "📚",
        rarity: "rare",
        category: "participation", 
        maxProgress: 10,
        points: 200,
        requirements: ["Complete 10 sessions"]
    },
    {
        id: 3,
        name: "Session Veteran",
        description: "Complete 50 sessions",
        icon: "🏅",
        rarity: "epic",
        category: "participation",
        maxProgress: 50,
        points: 500,
        requirements: ["Complete 50 sessions"]
    },
    {
        id: 4,
        name: "Poll Master",
        description: "Answer 500 questions across all sessions",
        icon: "📝",
        rarity: "epic",
        category: "participation",
        maxProgress: 500,
        points: 600,
        requirements: ["Answer 500 questions total"]
    },

    // PERFORMANCE ACHIEVEMENTS
    {
        id: 5,
        name: "Accuracy Expert",
        description: "Achieve 90%+ accuracy in a session",
        icon: "🎯",
        rarity: "rare",
        category: "performance",
        maxProgress: 1,
        points: 150,
        requirements: ["90%+ accuracy in one session"]
    },
    {
        id: 6,
        name: "Perfect Session",
        description: "Achieve 100% accuracy in a session",
        icon: "💯",
        rarity: "epic",
        category: "performance",
        maxProgress: 1,
        points: 300,
        requirements: ["100% accuracy in one session"]
    },
    {
        id: 7,
        name: "Consistency King",
        description: "Maintain 80%+ accuracy for 5 consecutive sessions",
        icon: "⚖️",
        rarity: "epic",
        category: "performance",
        maxProgress: 5,
        points: 400,
        requirements: ["80%+ accuracy", "5 consecutive sessions"]
    },
    {
        id: 8,
        name: "Perfect Scholar",
        description: "Achieve 100% accuracy in 3 different sessions",
        icon: "🏆",
        rarity: "legendary",
        category: "performance",
        maxProgress: 3,
        points: 750,
        requirements: ["100% accuracy", "3 different sessions"]
    },

    // SPEED ACHIEVEMENTS
    {
        id: 9,
        name: "Quick Thinker",
        description: "Average under 10 seconds per question in a session",
        icon: "⚡",
        rarity: "rare",
        category: "speed",
        maxProgress: 1,
        points: 200,
        requirements: ["Average <10 seconds per question"]
    },
    {
        id: 10,
        name: "Speed Demon",
        description: "Average under 5 seconds per question in a session",
        icon: "🚀",
        rarity: "epic",
        category: "speed",
        maxProgress: 1,
        points: 400,
        requirements: ["Average <5 seconds per question"]
    },

    // STREAK ACHIEVEMENTS
    {
        id: 11,
        name: "Hot Streak",
        description: "Get 10 questions correct in a row",
        icon: "🔥",
        rarity: "rare",
        category: "streak",
        maxProgress: 10,
        points: 250,
        requirements: ["10 consecutive correct answers"]
    },
    {
        id: 12,
        name: "Unstoppable",
        description: "Get 20 questions correct in a row",
        icon: "🌟",
        rarity: "epic",
        category: "streak",
        maxProgress: 20,
        points: 500,
        requirements: ["20 consecutive correct answers"]
    },

    // RANKING ACHIEVEMENTS
    {
        id: 13,
        name: "Top Performer",
        description: "Finish in 1st place in a session",
        icon: "🥇",
        rarity: "rare",
        category: "performance",
        maxProgress: 1,
        points: 200,
        requirements: ["Finish 1st in a session"]
    },
    {
        id: 14,
        name: "Podium Finisher",
        description: "Finish in top 3 in 10 sessions",
        icon: "🏆",
        rarity: "epic",
        category: "performance",
        maxProgress: 10,
        points: 400,
        requirements: ["Top 3 finish", "10 sessions"]
    },

    // KNOWLEDGE ACHIEVEMENTS (Subject-based)
    {
        id: 15,
        name: "AI Specialist",
        description: "Score 90%+ in 5 AI sessions",
        icon: "🤖",
        rarity: "epic",
        category: "knowledge",
        maxProgress: 5,
        points: 300,
        requirements: ["90%+ accuracy", "5 AI sessions"]
    },
    {
        id: 16,
        name: "DSA Master",
        description: "Score 90%+ in 5 DSA sessions",
        icon: "⚙️",
        rarity: "epic", 
        category: "knowledge",
        maxProgress: 5,
        points: 300,
        requirements: ["90%+ accuracy", "5 DSA sessions"]
    },

    // CONSISTENCY ACHIEVEMENTS
    {
        id: 17,
        name: "Steady Progress",
        description: "Participate in sessions for 7 consecutive days",
        icon: "📈",
        rarity: "rare",
        category: "consistency",
        maxProgress: 7,
        points: 200,
        requirements: ["Participate daily", "7 consecutive days"]
    }
];

// Calculate user's achievements based on their session data
export const getUserAchievements = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Get all user's session data
        const userSessions = await SessionReport.find({ 
            'studentResults.userId': userId 
        }).sort({ sessionEndedAt: -1 });

        // Get individual reports for streak calculations
        const userReports = await Report.find({ userId }).sort({ createdAt: 1 });

        // Calculate achievements
        const calculatedAchievements = ACHIEVEMENT_DEFINITIONS.map(achievement => {
            const result = calculateAchievement(achievement, userSessions, userReports, userId);
            return result;
        });

        // Calculate summary stats
        const earnedAchievements = calculatedAchievements.filter(a => a.earned);
        const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
        
        const stats = {
            totalEarned: earnedAchievements.length,
            legendary: earnedAchievements.filter(a => a.rarity === 'legendary').length,
            epic: earnedAchievements.filter(a => a.rarity === 'epic').length,
            rare: earnedAchievements.filter(a => a.rarity === 'rare').length,
            common: earnedAchievements.filter(a => a.rarity === 'common').length,
            totalPoints: totalPoints,
            completion: Math.round((earnedAchievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100)
        };

        res.status(200).json({
            success: true,
            achievements: calculatedAchievements,
            stats: stats
        });

    } catch (error: any) {
        console.error('Failed to calculate achievements:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to calculate achievements.',
            error: error.message 
        });
    }
};

// Helper function to calculate individual achievement progress
function calculateAchievement(
    achievementDef: Omit<Achievement, 'earned' | 'progress' | 'earnedDate'>,
    userSessions: any[],
    userReports: any[],
    userId: string
): Achievement {
    let progress = 0;
    let earned = false;
    let earnedDate: string | undefined;

    // OPTIMIZATION NOTE: Currently calculating ranks on-the-fly for consistency with sessionReport.controller.ts
    // Future improvement: Store pre-calculated ranks in SessionReport.studentResults to eliminate redundant calculations
    // Current approach ensures data consistency between controllers but has O(n log n) overhead per session
    
    // Extract user's results from sessions with calculated ranks  
    const userSessionResults = userSessions.map(session => {
        const userResult = session.studentResults.find((result: any) => 
            String(result.userId) === String(userId)
        );
        
        if (!userResult) return null;
        
        // Calculate rank using consistent logic with sessionReport.controller.ts
        // Primary: totalPoints (descending), Secondary: accuracy (descending), Tertiary: averageTime (ascending)
        const sortedResults = session.studentResults
            .sort((a: any, b: any) => {
                const aPoints = a.totalPoints || 0;
                const bPoints = b.totalPoints || 0;
                
                if (aPoints !== bPoints) {
                    return bPoints - aPoints; // Higher points first
                }
                
                // Tiebreaker 1: Higher accuracy
                if (a.accuracy !== b.accuracy) {
                    return (b.accuracy || 0) - (a.accuracy || 0);
                }
                
                // Tiebreaker 2: Lower average time
                return (a.averageTime || Infinity) - (b.averageTime || Infinity);
            });
        
        const userRank = sortedResults.findIndex((result: any) => 
            String(result.userId) === String(userId)
        ) + 1; // +1 because findIndex is 0-based
        
        return {
            ...userResult,
            rank: userRank,
            sessionName: session.sessionName,
            sessionDate: session.sessionEndedAt,
            sessionSubject: extractSubject(session.sessionName),
            // Ensure all numeric fields have default values
            accuracy: userResult.accuracy || 0,
            averageTime: userResult.averageTime || 0,
            totalPolls: userResult.totalPolls || 0,
            streak: userResult.streak || 0,
            longestStreak: userResult.longestStreak || 0
        };
    }).filter(Boolean);

    // Debug logging for rank issues
    if (achievementDef.id === 13) { // Top Performer
        console.log('=== DEBUG TOP PERFORMER ACHIEVEMENT ===');
        console.log('Total user sessions:', userSessions.length);
        console.log('User session results:', userSessionResults.length);
        userSessionResults.forEach((result, index) => {
            console.log(`Session ${index + 1}:`, {
                sessionName: result.sessionName,
                rank: result.rank,
                accuracy: result.accuracy,
                averageTime: result.averageTime
            });
        });
        const firstPlaces = userSessionResults.filter(result => result.rank === 1);
        console.log('First places found:', firstPlaces.length);
        console.log('=====================================');
    }

    // Debug logging for accuracy achievements
    if (achievementDef.id === 5 || achievementDef.id === 6) { // Accuracy Expert or Perfect Session
        console.log(`=== DEBUG ${achievementDef.name.toUpperCase()} ACHIEVEMENT ===`);
        console.log('User session results:', userSessionResults.length);
        userSessionResults.forEach((result, index) => {
            console.log(`Session ${index + 1}:`, {
                sessionName: result.sessionName,
                accuracy: result.accuracy,
                meetsThreshold: achievementDef.id === 5 ? result.accuracy >= 90 : result.accuracy >= 100
            });
        });
        console.log('=====================================');
    }

    switch (achievementDef.id) {
        // Participation achievements
        case 1: // First Steps
            progress = Math.min(userSessions.length, 1);
            break;
        case 2: // Regular Participant
            progress = Math.min(userSessions.length, 10);
            break;
        case 3: // Session Veteran  
            progress = Math.min(userSessions.length, 50);
            break;
        case 4: // Poll Master
            const totalQuestions = userSessionResults.reduce((sum, result) => sum + (result.totalPolls || 0), 0);
            progress = Math.min(totalQuestions, 500);
            break;

        // Performance achievements
        case 5: // Accuracy Expert (90%+)
            const highAccuracySessions = userSessionResults.filter(result => (result.accuracy || 0) >= 90);
            progress = Math.min(highAccuracySessions.length, 1);
            break;
        case 6: // Perfect Session (100%)
            const perfectSessions = userSessionResults.filter(result => (result.accuracy || 0) >= 100);
            progress = Math.min(perfectSessions.length, 1);
            break;
        case 7: // Consistency King (5 consecutive 80%+)
            progress = calculateConsecutiveHighPerformance(userSessionResults, 80, 5);
            break;
        case 8: // Perfect Scholar (3 perfect sessions)
            const perfectCount = userSessionResults.filter(result => (result.accuracy || 0) >= 100).length;
            progress = Math.min(perfectCount, 3);
            break;

        // Speed achievements
        case 9: // Quick Thinker (<10s avg)
            const quickSessions = userSessionResults.filter(result => (result.averageTime || Infinity) < 10);
            progress = Math.min(quickSessions.length, 1);
            break;
        case 10: // Speed Demon (<5s avg)
            const speedSessions = userSessionResults.filter(result => (result.averageTime || Infinity) < 5);
            progress = Math.min(speedSessions.length, 1);
            break;

        // Streak achievements
        case 11: // Hot Streak (10 consecutive)
            const allStreaks = userSessionResults.map(result => result.longestStreak || result.streak || 0);
            const bestSessionStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0;
            progress = Math.min(bestSessionStreak, 10);
            break;
        case 12: // Unstoppable (20 consecutive)
            const allLongStreaks = userSessionResults.map(result => result.longestStreak || result.streak || 0);
            const bestLongStreak = allLongStreaks.length > 0 ? Math.max(...allLongStreaks) : 0;
            progress = Math.min(bestLongStreak, 20);
            break;

        // Ranking achievements
        case 13: // Top Performer (1st place)
            const firstPlaces = userSessionResults.filter(result => result.rank === 1);
            progress = Math.min(firstPlaces.length, 1);
            break;
        case 14: // Podium Finisher (top 3 in 10 sessions)
            const podiumFinishes = userSessionResults.filter(result => result.rank && result.rank <= 3);
            progress = Math.min(podiumFinishes.length, 10);
            break;

        // Knowledge achievements
        case 15: // AI Specialist
            const aiSessions = userSessionResults.filter(result => 
                result.sessionSubject === 'AI' && (result.accuracy || 0) >= 90
            );
            progress = Math.min(aiSessions.length, 5);
            break;
        case 16: // DSA Master
            const dsaSessions = userSessionResults.filter(result => 
                result.sessionSubject === 'DSA' && (result.accuracy || 0) >= 90
            );
            progress = Math.min(dsaSessions.length, 5);
            break;

        // Consistency achievements
        case 17: // Steady Progress (7 consecutive days)
            progress = calculateConsecutiveDays(userSessions, 7);
            break;
    }

    earned = progress >= achievementDef.maxProgress;
    if (earned && userSessions.length > 0) {
        // Find approximate earned date (when progress was completed)
        earnedDate = userSessions[0].sessionEndedAt.toISOString().split('T')[0];
    }

    return {
        ...achievementDef,
        earned,
        progress,
        earnedDate
    };
}

// Helper functions
function extractSubject(sessionName: string): string {
    if (!sessionName) return 'General';
    
    const subjectPatterns = [
        { pattern: /^(DSA|Data Structures?|Algorithms?)/i, subject: 'DSA' },
        { pattern: /^(AI|Artificial Intelligence)/i, subject: 'AI' },
        { pattern: /^(ML|Machine Learning)/i, subject: 'ML' },
        { pattern: /^(Data Science)/i, subject: 'Data Science' },
    ];

    for (const { pattern, subject } of subjectPatterns) {
        if (pattern.test(sessionName)) {
            return subject;
        }
    }
    return 'General';
}

function calculateBestStreak(reports: any[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const report of reports) {
        if (report.isCorrect) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    
    return maxStreak;
}

function calculateConsecutiveHighPerformance(sessions: any[], minAccuracy: number, requiredCount: number): number {
    let consecutiveCount = 0;
    let maxConsecutive = 0;
    
    for (const session of sessions.reverse()) { // Start from oldest
        if ((session.accuracy || 0) >= minAccuracy) {
            consecutiveCount++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        } else {
            consecutiveCount = 0;
        }
    }
    
    return Math.min(maxConsecutive, requiredCount);
}

function calculateConsecutiveDays(sessions: any[], requiredDays: number): number {
    if (sessions.length === 0) return 0;
    
    // Group sessions by date
    const sessionDates = sessions.map(s => 
        new Date(s.sessionEndedAt).toISOString().split('T')[0]
    ).sort();
    
    const uniqueDates = [...new Set(sessionDates)];
    
    let consecutiveDays = 1;
    let maxConsecutive = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            consecutiveDays++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
        } else {
            consecutiveDays = 1;
        }
    }
    
    return Math.min(maxConsecutive, requiredDays);
}

// Debug endpoint to check session data structure
export const getDebugAchievementData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Get all user's session data
        const userSessions = await SessionReport.find({ 
            'studentResults.userId': userId 
        }).sort({ sessionEndedAt: -1 }).limit(5);

        const debugData = userSessions.map(session => {
            const userResult = session.studentResults.find((result: any) => 
                String(result.userId) === String(userId)
            );
            
            if (!userResult) return null;
            
            // Calculate rank using consistent logic (same as main function and sessionReport controller)
            const sortedResults = session.studentResults
                .sort((a: any, b: any) => {
                    const aPoints = a.totalPoints || 0;
                    const bPoints = b.totalPoints || 0;
                    
                    if (aPoints !== bPoints) {
                        return bPoints - aPoints; // Higher points first
                    }
                    
                    // Tiebreaker 1: Higher accuracy
                    if (a.accuracy !== b.accuracy) {
                        return (b.accuracy || 0) - (a.accuracy || 0);
                    }
                    
                    // Tiebreaker 2: Lower average time
                    return (a.averageTime || Infinity) - (b.averageTime || Infinity);
                });
            
            const userRank = sortedResults.findIndex((result: any) => 
                String(result.userId) === String(userId)
            ) + 1;
            
            return {
                sessionName: session.sessionName,
                sessionId: session._id,
                userResult: {
                    ...userResult,
                    calculatedRank: userRank
                },
                availableFields: Object.keys(userResult),
                allStudentResults: session.studentResults.map((result, index) => ({
                    userId: result.userId,
                    calculatedRank: sortedResults.findIndex(r => String(r.userId) === String(result.userId)) + 1,
                    accuracy: result.accuracy,
                    averageTime: result.averageTime,
                    totalPoints: result.totalPoints
                })).sort((a, b) => a.calculatedRank - b.calculatedRank) // Sort by rank
            };
        }).filter(Boolean);

        res.status(200).json({
            success: true,
            totalSessions: userSessions.length,
            debugData: debugData
        });

    } catch (error: any) {
        console.error('Failed to get debug data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get debug data.',
            error: error.message 
        });
    }
};