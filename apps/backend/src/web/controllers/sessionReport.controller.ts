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