import { Request, Response } from 'express';
import { Transcript } from '../models/transcript.model';

// Bulk save transcripts (for frontend audio capture)
export const saveTranscripts = async (req: Request, res: Response) => {
    try {
        console.log('📥 Received bulk transcript save request:', {
            body: req.body,
            transcriptCount: req.body.transcripts?.length
        });

        const { meetingId, role, participantId, transcripts } = req.body;

        if (!meetingId || !role || !participantId || !transcripts || !Array.isArray(transcripts)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: meetingId, role, participantId, transcripts'
            });
        }

        let savedCount = 0;
        const errors = [];

        for (const transcriptData of transcripts) {
            try {
                const transcript = await Transcript.create({
                    meetingId: transcriptData.meetingId || meetingId,
                    role: transcriptData.role || role,
                    participantId: transcriptData.participantId || participantId,
                    text: transcriptData.text,
                    type: transcriptData.type || 'final',
                    startTime: new Date(transcriptData.startTime),
                    endTime: new Date(transcriptData.endTime),
                    timestamp: new Date(transcriptData.timestamp)
                });

                savedCount++;
                console.log(`✅ Saved transcript ${savedCount}: "${transcriptData.text.substring(0, 50)}..."`);
            } catch (error) {
                console.error('❌ Error saving individual transcript:', error);
                errors.push(error);
            }
        }

        console.log(`💾 Bulk save complete: ${savedCount}/${transcripts.length} transcripts saved`);

        res.status(200).json({
            success: true,
            message: `Saved ${savedCount} transcripts`,
            savedCount,
            totalCount: transcripts.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ Bulk transcript save failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save transcripts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get transcripts for a specific meeting
export const getTranscriptsByMeeting = async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        const { type, role, participantId } = req.query;
        
        // Build filter object
        const filter: any = { meetingId };
        
        if (type && (type === 'partial' || type === 'final')) {
            filter.type = type;
        }
        
        if (role && (role === 'host' || role === 'participant')) {
            filter.role = role;
        }
        
        if (participantId) {
            filter.participantId = participantId;
        }

        const transcripts = await Transcript.find(filter)
            .sort({ timestamp: 1 }) // Order by timestamp ascending
            .lean();

        res.status(200).json({
            success: true,
            count: transcripts.length,
            data: transcripts
        });
    } catch (error: any) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transcripts',
            error: error.message
        });
    }
};

// Get full transcript text for a meeting (final transcripts only)
export const getFullTranscriptByMeeting = async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        
        const transcripts = await Transcript.find({
            meetingId,
            type: 'final'
        })
        .sort({ timestamp: 1 })
        .select('role participantId text timestamp startTime endTime')
        .lean();

        // Format as readable transcript
        const formattedTranscript = transcripts.map(t => ({
            timestamp: t.timestamp,
            speaker: `${t.role}${t.role === 'participant' ? `:${t.participantId}` : ''}`,
            text: t.text,
            duration: t.endTime && t.startTime ? 
                Math.round((new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) / 1000) : 0
        }));

        res.status(200).json({
            success: true,
            meetingId,
            transcriptCount: transcripts.length,
            transcript: formattedTranscript
        });
    } catch (error: any) {
        console.error('Error generating full transcript:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate transcript',
            error: error.message
        });
    }
};

// Export transcript as text file
export const exportTranscriptAsText = async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        
        const transcripts = await Transcript.find({
            meetingId,
            type: 'final'
        })
        .sort({ timestamp: 1 })
        .lean();

        if (transcripts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No transcripts found for this meeting'
            });
        }

        // Generate text format
        const textContent = transcripts
            .map(t => {
                const timestamp = new Date(t.timestamp).toLocaleString();
                const speaker = `${t.role}${t.role === 'participant' ? `:${t.participantId}` : ''}`;
                return `[${timestamp}] ${speaker}: ${t.text}`;
            })
            .join('\n\n');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="transcript-${meetingId}-${Date.now()}.txt"`);
        
        res.status(200).send(textContent);
    } catch (error: any) {
        console.error('Error exporting transcript:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export transcript',
            error: error.message
        });
    }
};

// Delete transcripts for a meeting (cleanup)
export const deleteTranscriptsByMeeting = async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        
        const result = await Transcript.deleteMany({ meetingId });
        
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} transcript(s) for meeting ${meetingId}`,
            deletedCount: result.deletedCount
        });
    } catch (error: any) {
        console.error('Error deleting transcripts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transcripts',
            error: error.message
        });
    }
};

// Get transcript statistics for a meeting
export const getTranscriptStats = async (req: Request, res: Response) => {
    try {
        const { meetingId } = req.params;
        
        const stats = await Transcript.aggregate([
            { $match: { meetingId } },
            {
                $group: {
                    _id: null,
                    totalTranscripts: { $sum: 1 },
                    finalTranscripts: {
                        $sum: { $cond: [{ $eq: ['$type', 'final'] }, 1, 0] }
                    },
                    partialTranscripts: {
                        $sum: { $cond: [{ $eq: ['$type', 'partial'] }, 1, 0] }
                    },
                    hostTranscripts: {
                        $sum: { $cond: [{ $eq: ['$role', 'host'] }, 1, 0] }
                    },
                    participantTranscripts: {
                        $sum: { $cond: [{ $eq: ['$role', 'participant'] }, 1, 0] }
                    },
                    totalWordCount: {
                        $sum: {
                            $size: { $split: ['$text', ' '] }
                        }
                    },
                    earliestTranscript: { $min: '$timestamp' },
                    latestTranscript: { $max: '$timestamp' }
                }
            }
        ]);

        const result = stats[0] || {
            totalTranscripts: 0,
            finalTranscripts: 0,
            partialTranscripts: 0,
            hostTranscripts: 0,
            participantTranscripts: 0,
            totalWordCount: 0,
            earliestTranscript: null,
            latestTranscript: null
        };

        // Calculate duration if we have timestamps
        let durationMinutes = 0;
        if (result.earliestTranscript && result.latestTranscript) {
            const duration = new Date(result.latestTranscript).getTime() - new Date(result.earliestTranscript).getTime();
            durationMinutes = Math.round(duration / (1000 * 60));
        }

        res.status(200).json({
            success: true,
            meetingId,
            stats: {
                ...result,
                durationMinutes,
                averageWordsPerTranscript: result.totalTranscripts > 0 ? 
                    Math.round(result.totalWordCount / result.totalTranscripts) : 0
            }
        });
    } catch (error: any) {
        console.error('Error fetching transcript stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transcript statistics',
            error: error.message
        });
    }
};