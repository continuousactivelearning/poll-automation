const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://sashipavan:SESSI111111%40%40%40%40%40%40@cluster0.tjsej5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkLatestTranscripts() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('poll-automation');
    const audiosCollection = db.collection('audios');
    
    // Get latest 10 transcripts
    const latestTranscripts = await audiosCollection.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log(`\\n📊 Latest ${latestTranscripts.length} transcripts from 'audios' collection:`);
    console.log('='.repeat(80));
    
    latestTranscripts.forEach((transcript, i) => {
      const roleLabel = transcript.role === 'host' ? 'host' : 
                       transcript.role === 'guest' ? 'cohost' : 'participant';
      
      console.log(\`\\n[\${i + 1}] \${new Date(transcript.timestamp).toLocaleTimeString()}\`);
      console.log(\`    \${roleLabel}: "\${transcript.text}"\`);
      console.log(\`    Meeting: \${transcript.meetingId}\`);
      console.log(\`    Participant: \${transcript.participantId}\`);
      console.log(\`    Confidence: \${transcript.confidence}\`);
      console.log(\`    Final: \${transcript.isFinal}\`);
    });
    
    // Count by role
    const hostCount = await audiosCollection.countDocuments({ role: 'host' });
    const guestCount = await audiosCollection.countDocuments({ role: 'guest' });
    const participantCount = await audiosCollection.countDocuments({ role: 'participant' });
    
    console.log('\\n📈 Transcript counts by role:');
    console.log(\`   Host transcripts: \${hostCount}\`);
    console.log(\`   Guest (cohost) transcripts: \${guestCount}\`);
    console.log(\`   Participant transcripts: \${participantCount}\`);
    console.log(\`   Total: \${hostCount + guestCount + participantCount}\`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\\n🔌 MongoDB connection closed');
  }
}

checkLatestTranscripts();