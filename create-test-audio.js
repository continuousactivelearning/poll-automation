const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/PollGenDb');

// Define Audio schema
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

async function createTestAudioData() {
  try {
    console.log('🎭 Creating test audio data...\n');
    
    // Create test audio records for demo-meeting-123
    const testTranscripts = [
      "Hello everyone, welcome to today's meeting about artificial intelligence",
      "artificial intelligence motions are very important in modern technology",
      "We need to discuss the latest developments in machine learning",
      "The impact of AI on our daily lives is becoming more significant",
      "Let's explore how neural networks can improve our processes"
    ];

    for (let i = 0; i < testTranscripts.length; i++) {
      const audioRecord = await Audio.create({
        meetingId: 'demo-meeting-123',
        participantId: `participant-${i}`,
        hostName: `Host ${i}`,
        role: i === 0 ? 'host' : 'participant',
        text: testTranscripts[i],
        confidence: 0.95,
        timestamp: new Date(Date.now() - (testTranscripts.length - i) * 30000), // 30 seconds apart
        sessionId: `session-${Date.now()}-${i}`,
        isFinal: true
      });

      console.log(`✅ Created test record ${i + 1}: "${testTranscripts[i].substring(0, 40)}..."`);
    }

    console.log('\n🎯 Test data created successfully!');
    console.log('Now you can test the AI Questions endpoint with meeting ID: demo-meeting-123');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestAudioData();