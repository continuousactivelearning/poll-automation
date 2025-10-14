const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/PollGenDb');

// Define Audio schema (must match the backend model)
const AudioSchema = new mongoose.Schema({
  meetingId: String,
  participantId: String,
  hostName: String,
  role: { type: String, enum: ['host', 'participant'] },
  text: String,
  confidence: Number,
  timestamp: Date,
  sessionId: String,
  isFinal: Boolean
}, {
  timestamps: true,
  collection: 'audios'
});

const Audio = mongoose.model('Audio', AudioSchema);

async function checkAudioData() {
  try {
    console.log('🔍 Checking audio data in database...\n');
    
    // Check what meetingIds exist
    const meetingIds = await Audio.distinct('meetingId');
    console.log('📋 Available meeting IDs:', meetingIds);
    
    // Check total count
    const totalCount = await Audio.countDocuments();
    console.log('📊 Total audio records:', totalCount);
    
    if (totalCount > 0) {
      // Show recent records
      const recent = await Audio.find({})
        .sort({ timestamp: -1 })
        .limit(5)
        .select('meetingId text timestamp role participantId');
      
      console.log('\n📝 Recent audio records:');
      recent.forEach((record, index) => {
        console.log(`${index + 1}. Meeting: ${record.meetingId}`);
        console.log(`   Text: "${record.text.substring(0, 80)}..."`);
        console.log(`   Role: ${record.role}, Participant: ${record.participantId}`);
        console.log(`   Time: ${record.timestamp}`);
        console.log('');
      });
      
      // Check specific meeting
      if (meetingIds.includes('demo-meeting-123')) {
        const demoRecords = await Audio.find({ meetingId: 'demo-meeting-123' }).countDocuments();
        console.log(`🎯 Records for demo-meeting-123: ${demoRecords}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAudioData();