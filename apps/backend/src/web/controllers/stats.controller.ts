import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Poll } from '../models/poll.model';
import { Report } from '../models/report.model';
import { SessionReport } from '../models/sessionReport.model';

// GET /api/stats/host
export const getHostStats = async (req: Request, res: Response) => {
  try {
  const user = (req as any).user;
  const hostId = user?.id || user?._id; // authenticate middleware should attach user
    if (!hostId) return res.status(401).json({ message: 'Unauthorized' });

    const hostObjectId = new mongoose.Types.ObjectId(hostId);

    // Total polls created by host
    const totalPollsPromise = Poll.countDocuments({ hostId: hostObjectId });

    // Avg response time and accuracy from Report (join via rooms/polls created by host)
    // First, find polls by host to restrict reports
    const hostPolls = await Poll.find({ hostId: hostObjectId }).select('_id').lean();
    const pollIds = hostPolls.map(p => p._id);

    const reportAgg = Report.aggregate([
      { $match: { pollId: { $in: pollIds } } },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$timeTaken' },
          totalAttempts: { $sum: 1 },
          correctCount: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        }
      }
    ]);

    // Active participants: unique users who answered polls for this host in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeParticipantsAgg = Report.aggregate([
      { $match: { pollId: { $in: pollIds }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$userId' } },
      { $count: 'activeParticipants' }
    ]);

    // Participation trends: number of unique participants per day over last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13); // include today

    const trendsAgg = Report.aggregate([
      { $match: { pollId: { $in: pollIds }, createdAt: { $gte: fourteenDaysAgo } } },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          userId: 1
        }
      },
      { $group: { _id: { day: '$day', user: '$userId' } } },
      { $group: { _id: '$_id.day', uniqueParticipants: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const [totalPolls, reportResults, activeParticipantsResults, trendsResults] = await Promise.all([
      totalPollsPromise,
      reportAgg,
      activeParticipantsAgg,
      trendsAgg
    ]);

    const avgResponseTime = reportResults[0]?.avgResponseTime ?? 0;
    const totalAttempts = reportResults[0]?.totalAttempts ?? 0;
    const correctCount = reportResults[0]?.correctCount ?? 0;
    const accuracyRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    const activeParticipants = activeParticipantsResults[0]?.activeParticipants ?? 0;

    // Build trends array for last 14 days with zeros where missing
    const trendsMap = new Map<string, number>();
    trendsResults.forEach((r: any) => trendsMap.set(r._id, r.uniqueParticipants));

    const trends: { date: string; participants: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      trends.push({ date: dayKey, participants: trendsMap.get(dayKey) ?? 0 });
    }

    // Recent sessions accuracy (latest 5 sessions for this host)
    const recentSessionsDocs = await SessionReport.find({ hostId: hostObjectId })
      .sort({ sessionEndedAt: -1 })
      .limit(5)
      .lean();

    const recentSessions = recentSessionsDocs.map((s: any) => {
      const results = Array.isArray(s.studentResults) ? s.studentResults : [];
      const avgAccuracy = results.length ? (results.reduce((sum: number, r: any) => sum + (r.accuracy ?? 0), 0) / results.length) : 0;
      return {
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        sessionEndedAt: s.sessionEndedAt,
        accuracyRate: Number(avgAccuracy.toFixed(2)),
        studentResultsCount: results.length,
      };
    });

    // Total sessions hosted (count of session reports)
    const totalSessions = await SessionReport.countDocuments({ hostId: hostObjectId });

    res.json({
      totalPolls,
      totalSessions,
      accuracyRate: Number(accuracyRate.toFixed(2)),
      activeParticipants,
      avgResponseTime: Number((avgResponseTime ?? 0).toFixed(2)),
      participationTrends: trends,
      recentSessions
    });
  } catch (error: any) {
    console.error('STATS ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};