// apps/backend/src/services/achievementTracker.ts

import { Server as SocketIOServer } from 'socket.io';
import { SessionReport } from '../web/models/sessionReport.model';
import { Report } from '../web/models/report.model';

export class AchievementTracker {
  private io: SocketIOServer | null = null;

  initialize(io: SocketIOServer) {
    this.io = io;
    console.log('✅ Achievement Tracker initialized with Socket.IO');
  }

  // Check and emit achievements after poll answer
  async checkPollAchievements(userId: string, roomId: string, isCorrect: boolean) {
    if (!this.io) return;

    try {
      // Get user's current session stats
      const currentSession = await SessionReport.findOne({
        roomId: roomId,
        'studentResults.userId': userId
      }).sort({ sessionEndedAt: -1 });

      if (!currentSession) return;

      const userResult = currentSession.studentResults.find(
        (result: any) => String(result.userId) === String(userId)
      );

      if (!userResult) return;

      const newAchievements: any[] = [];

      // Check First Steps (first poll answered)
      if (userResult.totalPolls === 1) {
        newAchievements.push({
          id: 1,
          name: "First Steps",
          description: "Answered your first question!",
          icon: "🎯",
          points: 50,
          rarity: "common"
        });
      }

      // Check Hot Streak (10 consecutive correct)
      if ((userResult.longestStreak || 0) >= 10 && !this.hasAchievement(userId, 11)) {
        newAchievements.push({
          id: 11,
          name: "Hot Streak",
          description: "10 questions correct in a row!",
          icon: "🔥",
          points: 250,
          rarity: "rare"
        });
      }

      // Check Unstoppable (20 consecutive correct)
      if ((userResult.longestStreak || 0) >= 20 && !this.hasAchievement(userId, 12)) {
        newAchievements.push({
          id: 12,
          name: "Unstoppable",
          description: "20 questions correct in a row!",
          icon: "🌟",
          points: 500,
          rarity: "epic"
        });
      }

      // Check Speed Demon (average < 5 seconds)
      if (userResult.averageTime < 5 && userResult.totalPolls >= 10) {
        if (!this.hasAchievement(userId, 10)) {
          newAchievements.push({
            id: 10,
            name: "Speed Demon",
            description: "Lightning fast responses!",
            icon: "🚀",
            points: 400,
            rarity: "epic"
          });
        }
      }

      // Emit new achievements to user
      if (newAchievements.length > 0) {
        this.io.to(userId).emit('achievement-unlocked', {
          achievements: newAchievements,
          timestamp: new Date()
        });

        console.log(`🏆 User ${userId} unlocked ${newAchievements.length} achievement(s)`);
      }

    } catch (error) {
      console.error('Error checking poll achievements:', error);
    }
  }

  // Check achievements after session ends
  async checkSessionAchievements(userId: string, sessionId: string) {
    if (!this.io) return;

    try {
      const session = await SessionReport.findById(sessionId);
      if (!session) return;

      const userResult = session.studentResults.find(
        (result: any) => String(result.userId) === String(userId)
      );

      if (!userResult) return;

      const newAchievements: any[] = [];

      // Calculate rank
      const sortedResults = session.studentResults
        .sort((a: any, b: any) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return a.averageTime - b.averageTime;
        });

      const userRank = sortedResults.findIndex(
        (result: any) => String(result.userId) === String(userId)
      ) + 1;

      // Check Top Performer (1st place)
      if (userRank === 1 && !this.hasAchievement(userId, 13)) {
        newAchievements.push({
          id: 13,
          name: "Top Performer",
          description: "Finished 1st place in a session!",
          icon: "🥇",
          points: 200,
          rarity: "rare"
        });
      }

      // Check Accuracy Expert (90%+)
      if (userResult.accuracy >= 90 && !this.hasAchievement(userId, 5)) {
        newAchievements.push({
          id: 5,
          name: "Accuracy Expert",
          description: "Achieved 90%+ accuracy!",
          icon: "🎯",
          points: 150,
          rarity: "rare"
        });
      }

      // Check Perfect Session (100%)
      if (userResult.accuracy >= 100 && !this.hasAchievement(userId, 6)) {
        newAchievements.push({
          id: 6,
          name: "Perfect Session",
          description: "100% accuracy achieved!",
          icon: "💯",
          points: 300,
          rarity: "epic"
        });
      }

      // Emit new achievements
      if (newAchievements.length > 0) {
        this.io.to(userId).emit('achievement-unlocked', {
          achievements: newAchievements,
          timestamp: new Date()
        });

        // Also emit achievement stats update
        this.io.to(userId).emit('achievement-stats-update', {
          refresh: true
        });

        console.log(`🏆 User ${userId} unlocked ${newAchievements.length} session achievement(s)`);
      }

    } catch (error) {
      console.error('Error checking session achievements:', error);
    }
  }

  // Helper to check if user already has achievement (simplified)
  private hasAchievement(userId: string, achievementId: number): boolean {
    // In production, you'd check a dedicated achievements collection
    // For now, we'll allow re-earning to test the system
    return false;
  }

  // Get real-time achievement progress
  async getRealtimeProgress(userId: string) {
    try {
      const sessions = await SessionReport.find({
        'studentResults.userId': userId
      }).sort({ sessionEndedAt: -1 });

      const userResults = sessions.map(session => {
        const result = session.studentResults.find(
          (r: any) => String(r.userId) === String(userId)
        );
        return result;
      }).filter(Boolean);

      return {
        totalSessions: sessions.length,
        totalQuestions: userResults.reduce((sum, r: any) => sum + (r.totalPolls || 0), 0),
        averageAccuracy: userResults.reduce((sum, r: any) => sum + (r.accuracy || 0), 0) / userResults.length,
        bestStreak: Math.max(...userResults.map((r: any) => r.longestStreak || 0))
      };
    } catch (error) {
      console.error('Error getting realtime progress:', error);
      return null;
    }
  }
}

export const achievementTracker = new AchievementTracker();