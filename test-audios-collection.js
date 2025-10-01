const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://sashipavan:SESSI111111%40%40%40%40%40%40@cluster0.tjsej5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testAudiosCollection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('poll-automation');
    
    // Create a test audio record
    const audiosCollection = db.collection('audios');
    
    const testAudio = {
      meetingId: 'test-meeting-' + Date.now(),
      participantId: 'test-host',
      hostName: 'Test Host',
      role: 'host',
      text: 'This is a test transcript from the new audios collection',
      confidence: 0.95,
      timestamp: new Date(),
      sessionId: 'test-session-' + Date.now(),
      isFinal: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 Creating test audio record...');
    const result = await audiosCollection.insertOne(testAudio);
    console.log('✅ Test audio record created:', result.insertedId);
    
    // Check total count
    const totalCount = await audiosCollection.countDocuments();
    console.log('📊 Total records in audios collection:', totalCount);
    
    // Fetch and display all records
    const allAudios = await audiosCollection.find({}).sort({ timestamp: -1 }).toArray();
    
    console.log('\\n=== AUDIOS COLLECTION CONTENT ===');
    allAudios.forEach((audio, i) => {
      console.log(`\\n--- Audio ${i + 1} ---`);
      console.log('ID:', audio._id);
      console.log('Meeting ID:', audio.meetingId);
      console.log('Participant/Host:', audio.participantId, '/', audio.hostName);
      console.log('Role:', audio.role);
      console.log('Text:', audio.text);
      console.log('Confidence:', audio.confidence);
      console.log('Timestamp:', audio.timestamp);
      console.log('Session ID:', audio.sessionId);
      console.log('Is Final:', audio.isFinal);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\\n🔌 MongoDB connection closed');
  }
}

testAudiosCollection();