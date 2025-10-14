import { AutoQuestionService } from './autoQuestionService';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Global service manager for auto question generation
 * This allows routes to access the service with Socket.IO instance
 */
class ServiceManager {
  private static instance: ServiceManager;
  private autoQuestionService?: AutoQuestionService;

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  initializeServices(io: SocketIOServer) {
    this.autoQuestionService = new AutoQuestionService(io);
    console.log('✅ [SERVICES] Auto question service initialized with Socket.IO');
  }

  getAutoQuestionService(): AutoQuestionService {
    if (!this.autoQuestionService) {
      throw new Error('AutoQuestionService not initialized. Call initializeServices first.');
    }
    return this.autoQuestionService;
  }
}

export default ServiceManager;