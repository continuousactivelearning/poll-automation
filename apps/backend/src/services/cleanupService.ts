// apps/backend/src/services/cleanupService.ts
import { Room } from '../web/models/room.model';
import { Poll } from '../web/models/poll.model';

export class CleanupService {
  private static instance: CleanupService;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  // Start automatic cleanup every 15 minutes
  startPeriodicCleanup(intervalMinutes: number = 15) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        await this.cleanupEmptySessions();
      } catch (error) {
        console.error('Periodic cleanup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`🧹 Cleanup service started - running every ${intervalMinutes} minutes`);
  }

  stopPeriodicCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧹 Cleanup service stopped');
    }
  }

  async cleanupEmptySessions(): Promise<{ deletedCount: number; message: string }> {
    try {
      console.log('🧹 Starting cleanup of empty sessions...');
      
      const activeRooms = await Room.find({ isActive: true });
      let deletedCount = 0;

      for (const room of activeRooms) {
        // Check if this room has any polls
        const pollCount = await Poll.countDocuments({ sessionId: room._id });
        
        // If no polls and room is older than 30 minutes, mark as inactive
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        if (pollCount === 0 && (room as any).createdAt < thirtyMinsAgo) {
          await Room.updateOne({ _id: room._id }, { isActive: false });
          deletedCount++;
          console.log(`🧹 Cleaned up empty session: ${room.name} (${room.code})`);
        }
      }

      const message = `Cleaned up ${deletedCount} empty sessions`;
      console.log(`🧹 ${message}`);
      
      return { deletedCount, message };
    } catch (error) {
      console.error('🧹 Cleanup error:', error);
      throw error;
    }
  }

  // Manual cleanup method that can be called via API
  async manualCleanup(): Promise<{ deletedCount: number; message: string }> {
    return await this.cleanupEmptySessions();
  }
}

export default CleanupService.getInstance();