// Transcript Sync Service - Automatically sends live transcripts to backend
// This service bridges the frontend audio capture and backend MongoDB storage

import type { LocalTranscript } from './localTranscripts';

export interface BackendTranscript {
  meetingId: string;
  role: 'host' | 'participant';
  participantId: string;
  text: string;
  type: 'partial' | 'final';
  startTime: number;
  endTime: number;
  timestamp: number;
}

export class TranscriptSyncService {
  private static instance: TranscriptSyncService;
  private pendingTranscripts: BackendTranscript[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  private constructor() {
    // Check online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingTranscripts();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Start periodic sync
    this.startPeriodicSync();
  }

  public static getInstance(): TranscriptSyncService {
    if (!TranscriptSyncService.instance) {
      TranscriptSyncService.instance = new TranscriptSyncService();
    }
    return TranscriptSyncService.instance;
  }

  /**
   * Sync a single transcript to backend immediately
   */
  public async syncTranscript(transcript: LocalTranscript): Promise<boolean> {
    const backendTranscript: BackendTranscript = {
      meetingId: transcript.meetingId,
      role: transcript.speaker === 'host' ? 'host' : 'participant',
      participantId: transcript.participantId,
      text: transcript.text,
      type: 'final', // Assume final for now
      startTime: transcript.timestamp,
      endTime: transcript.timestamp + 1000, // Add 1 second duration
      timestamp: transcript.timestamp
    };

    console.log(`📤 [SYNC] Attempting to sync transcript to backend:`, {
      meetingId: backendTranscript.meetingId,
      textPreview: backendTranscript.text.substring(0, 50) + '...',
      length: backendTranscript.text.length
    });

    if (!this.isOnline) {
      console.log(`📴 [SYNC] Offline - queuing transcript for later sync`);
      this.pendingTranscripts.push(backendTranscript);
      return false;
    }

    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: backendTranscript.meetingId,
          role: backendTranscript.role,
          participantId: backendTranscript.participantId,
          transcripts: [backendTranscript]
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [SYNC] Successfully synced transcript to backend:`, result);
        return true;
      } else {
        console.warn(`⚠️ [SYNC] Failed to sync transcript - HTTP ${response.status}:`, response.statusText);
        this.pendingTranscripts.push(backendTranscript);
        return false;
      }
    } catch (error) {
      console.error(`❌ [SYNC] Error syncing transcript to backend:`, error);
      this.pendingTranscripts.push(backendTranscript);
      return false;
    }
  }

  /**
   * Sync multiple transcripts in batch
   */
  public async syncTranscriptsBatch(transcripts: LocalTranscript[]): Promise<number> {
    if (!this.isOnline || transcripts.length === 0) {
      return 0;
    }

    const backendTranscripts: BackendTranscript[] = transcripts.map(t => ({
      meetingId: t.meetingId,
      role: t.speaker === 'host' ? 'host' : 'participant',
      participantId: t.participantId,
      text: t.text,
      type: 'final',
      startTime: t.timestamp,
      endTime: t.timestamp + 1000,
      timestamp: t.timestamp
    }));

    console.log(`📤 [SYNC] Batch syncing ${backendTranscripts.length} transcripts to backend`);

    try {
      // Group by meeting ID for separate API calls
      const grouped = backendTranscripts.reduce((acc, transcript) => {
        if (!acc[transcript.meetingId]) {
          acc[transcript.meetingId] = [];
        }
        acc[transcript.meetingId].push(transcript);
        return acc;
      }, {} as Record<string, BackendTranscript[]>);

      let successCount = 0;

      for (const [meetingId, meetingTranscripts] of Object.entries(grouped)) {
        try {
          const response = await fetch('/api/transcripts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meetingId,
              role: meetingTranscripts[0].role,
              participantId: meetingTranscripts[0].participantId,
              transcripts: meetingTranscripts
            })
          });

          if (response.ok) {
            const result = await response.json();
            successCount += result.savedCount || meetingTranscripts.length;
            console.log(`✅ [SYNC] Batch synced ${result.savedCount || meetingTranscripts.length} transcripts for meeting ${meetingId}`);
          } else {
            console.warn(`⚠️ [SYNC] Failed to batch sync transcripts for meeting ${meetingId}`);
            this.pendingTranscripts.push(...meetingTranscripts);
          }
        } catch (error) {
          console.error(`❌ [SYNC] Error batch syncing transcripts for meeting ${meetingId}:`, error);
          this.pendingTranscripts.push(...meetingTranscripts);
        }
      }

      return successCount;
    } catch (error) {
      console.error(`❌ [SYNC] Error in batch sync:`, error);
      return 0;
    }
  }

  /**
   * Sync all pending transcripts
   */
  private async syncPendingTranscripts(): Promise<void> {
    if (this.pendingTranscripts.length === 0) {
      return;
    }

    console.log(`🔄 [SYNC] Syncing ${this.pendingTranscripts.length} pending transcripts`);
    
    const transcriptsToSync = [...this.pendingTranscripts];
    this.pendingTranscripts = [];

    // Convert to LocalTranscript format for batch sync
    const localTranscripts: LocalTranscript[] = transcriptsToSync.map(t => ({
      id: `${t.meetingId}-${t.timestamp}`,
      meetingId: t.meetingId,
      text: t.text,
      speaker: t.role === 'host' ? 'host' : 'guest',
      participantId: t.participantId,
      timestamp: t.timestamp,
      confidence: 0.9
    }));

    const syncedCount = await this.syncTranscriptsBatch(localTranscripts);
    
    if (syncedCount < transcriptsToSync.length) {
      // Some failed, they were added back to pending
      console.log(`⚠️ [SYNC] Only ${syncedCount}/${transcriptsToSync.length} pending transcripts synced successfully`);
    } else {
      console.log(`✅ [SYNC] All ${syncedCount} pending transcripts synced successfully`);
    }
  }

  /**
   * Start periodic sync of pending transcripts
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.pendingTranscripts.length > 0) {
        this.syncPendingTranscripts();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Stop the sync service
   */
  public stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get current sync status
   */
  public getStatus(): { isOnline: boolean; pendingCount: number } {
    return {
      isOnline: this.isOnline,
      pendingCount: this.pendingTranscripts.length
    };
  }

  /**
   * Force sync all pending transcripts now
   */
  public async forceSyncNow(): Promise<void> {
    await this.syncPendingTranscripts();
  }
}