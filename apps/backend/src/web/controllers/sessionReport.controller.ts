// apps/backend/src/web/controllers/sessionReport.controller.ts

import { Request, Response } from 'express';
import { SessionReport } from '../models/sessionReport.model';



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