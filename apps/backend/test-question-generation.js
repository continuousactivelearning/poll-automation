const mongoose = require('mongoose');

// Test script to verify AutoQuestionService is working
async function testQuestionGeneration() {
  try {
    console.log('🧪 [TEST] Starting question generation test...');
    
    // Connect to database
    const mongoUri = 'mongodb+srv://sashipavan:SESSI111111%40%40%40%40%40%40@cluster0.tjsej5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ [TEST] Database connected');
    
    // Import services (note: this won't work directly since they're TypeScript)
    // We'll test the API endpoint instead
    
    const response = await fetch('http://localhost:8000/api/segments/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingId: '507f1f77bcf86cd799439011',
        hostmail: 'test@example.com',
        transcriptText: 'This is a comprehensive test of the automatic question generation system. We are discussing machine learning algorithms, neural networks, and their applications in modern technology. How can we ensure these systems are reliable and efficient?'
      })
    });
    
    const result = await response.json();
    console.log('✅ [TEST] Segment saved:', result);
    
    // Wait a bit for async processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if questions were generated
    const questionsResponse = await fetch(`http://localhost:8000/api/segments/507f1f77bcf86cd799439011/questions`);
    const questionsResult = await questionsResponse.json();
    
    console.log('📊 [TEST] Questions result:', questionsResult);
    
    if (questionsResult.questionsCount > 0) {
      console.log('✅ [TEST] SUCCESS! Questions were generated automatically');
    } else {
      console.log('❌ [TEST] FAILED! No questions were generated');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Database disconnected');
  }
}

testQuestionGeneration();