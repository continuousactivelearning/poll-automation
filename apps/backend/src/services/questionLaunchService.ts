// File: apps/backend/src/services/questionLaunchService.ts

import mongoose from 'mongoose';
import { Poll, IPoll } from '../web/models/poll.model';
import { GeneratedQuestions } from '../web/models/questions.model';
import { Room } from '../web/models/room.model';
import { Socket } from 'socket.io';

export class QuestionLaunchService {
  private io: any;

  constructor(io: any) {
    this.io = io;
  }

  /**
   * Convert a generated question to a poll and launch it to students
   */
  async launchGeneratedQuestion(
    meetingId: string, 
    questionId: string, 
    hostId: string,
    timerDuration: number = 30
  ): Promise<{ success: boolean; poll?: IPoll; error?: string }> {
    try {
      console.log(`🚀 [QUESTION LAUNCH] Converting question ${questionId} to poll for meeting: ${meetingId}`);

      // Find the generated question
      const generatedQuestions = await GeneratedQuestions.findOne({ 
        meetingId,
        'questions.id': questionId 
      });

      if (!generatedQuestions) {
        return { success: false, error: 'Question not found' };
      }

      // Find the specific question
      const question = generatedQuestions.questions.find(q => q.id === questionId);
      if (!question) {
        return { success: false, error: 'Question not found in collection' };
      }

      // Find the active room for this host (since meetings are tied to rooms through hostId)
      const room = await Room.findOne({ hostId: new mongoose.Types.ObjectId(hostId), isActive: true });
      if (!room) {
        return { success: false, error: 'No active room found for this host' };
      }

      // Convert generated question to poll format
      const pollData = {
        hostId: new mongoose.Types.ObjectId(hostId),
        sessionId: room._id as mongoose.Types.ObjectId,
        title: question.questionText,
        type: question.type === 'multiple_choice' ? 'mcq' as const : 'truefalse' as const,
        options: question.options || [],
        correctAnswer: question.type === 'multiple_choice' 
          ? question.options?.[question.correctIndex || 0] || question.options?.[0] || ''
          : question.options?.[question.correctIndex || 0] || 'True',
        timerDuration: timerDuration
      };

      console.log(`📝 [QUESTION LAUNCH] Creating poll with data:`, {
        title: pollData.title.substring(0, 50) + '...',
        type: pollData.type,
        optionsCount: pollData.options.length,
        correctAnswer: pollData.correctAnswer,
        timerDuration: pollData.timerDuration
      });

      // Create the poll
      const poll = new Poll(pollData);
      await poll.save();

      // Update the room with current poll
      room.currentPoll = poll._id as mongoose.Types.ObjectId;
      await room.save();

      // Update the question status to launched
      await GeneratedQuestions.updateOne(
        { meetingId, 'questions.id': questionId },
        { 
          $set: { 
            'questions.$.status': 'launched',
            'questions.$.launchedAt': new Date(),
            'questions.$.pollId': poll._id  // Link to the created poll
          }
        }
      );

      console.log(`✅ [QUESTION LAUNCH] Poll created with ID: ${poll._id}`);

      // Emit poll-started event to students
      await this.broadcastPollToStudents((room._id as mongoose.Types.ObjectId).toString(), poll);

      return { success: true, poll };

    } catch (error) {
      console.error('❌ [QUESTION LAUNCH] Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Broadcast poll to all students in the room via WebSocket
   */
  private async broadcastPollToStudents(roomId: string, poll: IPoll): Promise<void> {
    try {
      const pollDataForClient = {
        _id: (poll._id as mongoose.Types.ObjectId).toString(),
        title: poll.title,
        options: poll.options,
        timerDuration: poll.timerDuration
      };
      
      console.log('📤 [QUESTION LAUNCH] Broadcasting poll-started to room:', roomId);
      console.log('📊 [QUESTION LAUNCH] Poll data for students:', pollDataForClient);
      
      // Get sockets in the room to see who will receive the event
      const socketsInRoom = await this.io.in(roomId).fetchSockets();
      console.log('👥 [QUESTION LAUNCH] Students in room:', socketsInRoom.length);
      
      // Emit the poll-started event (this is what students are listening for)
      this.io.to(roomId).emit('poll-started', pollDataForClient);
      console.log('✅ [QUESTION LAUNCH] Poll-started event emitted to students');

    } catch (error) {
      console.error('❌ [QUESTION LAUNCH] Error broadcasting poll:', error);
    }
  }

  /**
   * Launch multiple questions as a sequence (for batch launching)
   */
  async launchQuestionSequence(
    meetingId: string,
    questionIds: string[],
    hostId: string,
    timerDuration: number = 30,
    delayBetweenQuestions: number = 5000
  ): Promise<{ success: boolean; launchedPolls: IPoll[]; errors: string[] }> {
    const launchedPolls: IPoll[] = [];
    const errors: string[] = [];

    for (let i = 0; i < questionIds.length; i++) {
      const questionId = questionIds[i];
      console.log(`🔄 [SEQUENCE LAUNCH] Launching question ${i + 1}/${questionIds.length}: ${questionId}`);

      const result = await this.launchGeneratedQuestion(meetingId, questionId, hostId, timerDuration);
      
      if (result.success && result.poll) {
        launchedPolls.push(result.poll);
        console.log(`✅ [SEQUENCE LAUNCH] Question ${i + 1} launched successfully`);
      } else {
        errors.push(`Question ${questionId}: ${result.error}`);
        console.log(`❌ [SEQUENCE LAUNCH] Question ${i + 1} failed: ${result.error}`);
      }

      // Add delay between questions (except for the last one)
      if (i < questionIds.length - 1) {
        console.log(`⏱️ [SEQUENCE LAUNCH] Waiting ${delayBetweenQuestions}ms before next question...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenQuestions));
      }
    }

    return {
      success: errors.length === 0,
      launchedPolls,
      errors
    };
  }
}