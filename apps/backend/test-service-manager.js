// Test the ServiceManager initialization and AutoQuestionService creation

const ServiceManager = require('../dist/services/serviceManager').default;

async function testServiceManager() {
  try {
    console.log('🧪 [TEST] Testing ServiceManager...');
    
    // Get instance
    const serviceManager = ServiceManager.getInstance();
    console.log('✅ [TEST] ServiceManager instance created');
    
    // Try to get auto question service
    try {
      const autoQuestionService = serviceManager.getAutoQuestionService();
      console.log('✅ [TEST] AutoQuestionService retrieved successfully');
      console.log('✅ [TEST] Service type:', typeof autoQuestionService);
      console.log('✅ [TEST] Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(autoQuestionService)));
    } catch (error) {
      console.error('❌ [TEST] Error getting AutoQuestionService:', error.message);
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error with ServiceManager:', error);
  }
}

testServiceManager();