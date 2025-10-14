const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAvailableModels() {
  try {
    const apiKey = 'AIzaSyCJoHEBAHDn6yDRSbwogerrpHF-tw5_Mjk'; // From your .env
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('🔍 Fetching available Gemini models...');
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('✅ Available models:');
    models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
    
  } catch (error) {
    console.error('❌ Error listing models:', error);
    
    // Try common model names
    const commonModels = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'text-bison',
      'models/gemini-pro',
      'models/gemini-1.5-pro'
    ];
    
    console.log('\n🧪 Testing common model names...');
    
    for (const modelName of commonModels) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a simple request
        const result = await model.generateContent('Hello');
        console.log(`✅ ${modelName} - WORKS`);
        break; // Stop at first working model
      } catch (err) {
        console.log(`❌ ${modelName} - ${err.message.substring(0, 100)}...`);
      }
    }
  }
}

listAvailableModels();