import mongoose from 'mongoose';
import { getSocketInstance } from '../websocket/studentWebSocket';
import Question from '../web/models/question.model';

interface DocumentCount {
  questions: number;
}

interface QuestionSnapshot {
  _id: string;
  question: string;
  created_at: Date;
  is_active: boolean;
  is_approved: boolean;
}

class MongoDBPollingWatcher {
  private isWatching = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCounts: DocumentCount = { questions: 0 };
  private lastQuestionSnapshot: QuestionSnapshot[] = [];
  private pollIntervalMs = 1500; // Poll every 1.5 seconds for better responsiveness
  private lastActivity = new Date();

  public startWatching() {
    if (this.isWatching) {
      console.log('⚠️ Polling watcher already running');
      return;
    }

    this.isWatching = true;
    this.initializeData();
    this.startPolling();
    console.log('👀 MongoDB polling watcher started');
  }

  public stopWatching() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isWatching = false;
    console.log('⏹️ MongoDB polling watcher stopped');
  }

  private async initializeData() {
    try {
      const questionCount = await Question.countDocuments();
      const questions = (await Question.find(
        {},
        '_id question created_at is_active is_approved'
      )
        .sort({ created_at: -1 })
        .lean()) as Array<{
        _id: any;
        question: string;
        created_at: Date;
        is_active: boolean;
        is_approved: boolean;
      }>;

      this.lastCounts = { questions: questionCount };
      this.lastQuestionSnapshot = questions.map((q) => ({
        _id: q._id.toString(),
        question: q.question,
        created_at: q.created_at,
        is_active: q.is_active,
        is_approved: q.is_approved,
      }));

      console.log('📊 Initial data loaded:', this.lastCounts);
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    }
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkForChanges();
      } catch (error) {
        console.error('❌ Error during polling:', error);
      }
    }, this.pollIntervalMs);
  }

  private async checkForChanges() {
    try {
      const currentQuestionCount = await Question.countDocuments();
      const currentSnapshot = (await Question.find(
        {},
        '_id question created_at is_active is_approved'
      )
        .sort({ created_at: -1 })
        .lean()) as Array<{
        _id: any;
        question: string;
        created_at: Date;
        is_active: boolean;
        is_approved: boolean;
      }>;

      const currentQuestionSnapshot: QuestionSnapshot[] = currentSnapshot.map(
        (q) => ({
          _id: q._id.toString(),
          question: q.question,
          created_at: q.created_at,
          is_active: q.is_active,
          is_approved: q.is_approved,
        })
      );

      // Check if question count changed
      if (currentQuestionCount !== this.lastCounts.questions) {
        await this.handleQuestionCountChange(
          currentQuestionCount,
          currentQuestionSnapshot
        );
      } else {
        // Check for updates in existing questions
        await this.checkForQuestionUpdates(currentQuestionSnapshot);
      }

      this.lastQuestionSnapshot = currentQuestionSnapshot;
    } catch (error) {
      console.error('❌ Error checking for changes:', error);
    }
  }

  private async checkForQuestionUpdates(currentSnapshot: QuestionSnapshot[]) {
    try {
      const io = getSocketInstance();
      let hasUpdates = false;

      for (const currentQ of currentSnapshot) {
        const oldQ = this.lastQuestionSnapshot.find(
          (q) => q._id === currentQ._id
        );

        if (
          oldQ &&
          (oldQ.is_active !== currentQ.is_active ||
            oldQ.is_approved !== currentQ.is_approved ||
            oldQ.question !== currentQ.question)
        ) {
          // Question updated
          const fullQuestion = await Question.findById(currentQ._id);
          if (fullQuestion) {
            console.log(`✏️ Question updated: ${currentQ._id}`);
            io.emit('question-updated', {
              type: 'update',
              collection: 'questions',
              id: currentQ._id,
              data: fullQuestion,
              timestamp: new Date().toISOString(),
            });
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        this.lastActivity = new Date();
      }
    } catch (error) {
      console.error('❌ Error checking for question updates:', error);
    }
  }

  private async handleQuestionCountChange(
    newCount: number,
    currentSnapshot: QuestionSnapshot[]
  ) {
    const oldCount = this.lastCounts.questions;
    this.lastCounts.questions = newCount;

    console.log(`📊 Question count changed: ${oldCount} → ${newCount}`);

    try {
      const io = getSocketInstance();

      if (newCount > oldCount) {
        // New question(s) added - find the new ones
        const newQuestionIds = currentSnapshot
          .filter(
            (current) =>
              !this.lastQuestionSnapshot.some((old) => old._id === current._id)
          )
          .map((q) => q._id);

        for (const questionId of newQuestionIds) {
          const fullQuestion = await Question.findById(questionId);
          if (fullQuestion) {
            console.log(`➕ New question detected: ${questionId}`);
            io.emit('question-added', {
              type: 'insert',
              collection: 'questions',
              data: fullQuestion,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } else if (newCount < oldCount) {
        // Question(s) deleted - find the deleted ones
        const deletedQuestionIds = this.lastQuestionSnapshot
          .filter(
            (old) => !currentSnapshot.some((current) => current._id === old._id)
          )
          .map((q) => q._id);

        for (const questionId of deletedQuestionIds) {
          console.log(`🗑️ Question deleted: ${questionId}`);
          io.emit('question-deleted', {
            type: 'delete',
            collection: 'questions',
            id: questionId,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Also emit a general data-changed event
      io.emit('data-changed', {
        type: newCount > oldCount ? 'insert' : 'delete',
        collection: 'questions',
        oldCount,
        newCount,
        timestamp: new Date().toISOString(),
      });

      this.lastActivity = new Date();
    } catch (error) {
      console.error('❌ Error handling question count change:', error);
    }
  }

  // Method to manually trigger a check (useful for testing)
  public async triggerCheck() {
    console.log('🔍 Manually triggering change check...');
    await this.checkForChanges();
  }

  // Get watcher statistics
  public getStats() {
    return {
      isWatching: this.isWatching,
      lastCounts: this.lastCounts,
      lastActivity: this.lastActivity,
      pollIntervalMs: this.pollIntervalMs,
    };
  }

  // Update polling interval
  public updatePollingInterval(intervalMs: number) {
    this.pollIntervalMs = intervalMs;
    if (this.isWatching) {
      this.stopWatching();
      this.startWatching();
    }
    console.log(`⏰ Polling interval updated to ${intervalMs}ms`);
  }
}

export const mongoPollingWatcher = new MongoDBPollingWatcher();
export default mongoPollingWatcher;
