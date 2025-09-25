import mongoose from 'mongoose';
import { getSocketInstance } from '../websocket/studentWebSocket';

interface ChangeStreamDocument {
  _id: any;
  operationType: string;
  fullDocument?: any;
  ns: {
    db: string;
    coll: string;
  };
  documentKey: {
    _id: any;
  };
}

class MongoDBChangeWatcher {
  private changeStream: mongoose.mongo.ChangeStream | null = null;
  private isWatching = false;

  public startWatching() {
    if (this.isWatching) {
      console.log('⚠️ Change stream already watching');
      return;
    }

    try {
      // Check if database connection is ready
      if (!mongoose.connection.db) {
        console.error('❌ Database connection not ready');
        return;
      }

      // Watch for changes in the entire database
      this.changeStream = mongoose.connection.db.watch([], {
        fullDocument: 'updateLookup',
      });

      this.changeStream.on('change', (change: ChangeStreamDocument) => {
        this.handleChange(change);
      });

      this.changeStream.on('error', (error) => {
        console.error('❌ Change stream error:', error);
        this.restartWatching();
      });

      this.changeStream.on('close', () => {
        console.log('🔄 Change stream closed');
        this.isWatching = false;
      });

      this.isWatching = true;
      console.log('👀 MongoDB change stream started');
    } catch (error) {
      console.error('❌ Error starting change stream:', error);
    }
  }

  public stopWatching() {
    if (this.changeStream) {
      this.changeStream.close();
      this.changeStream = null;
      this.isWatching = false;
      console.log('⏹️ MongoDB change stream stopped');
    }
  }

  private handleChange(change: ChangeStreamDocument) {
    console.log('📊 Database change detected:', {
      operation: change.operationType,
      collection: change.ns.coll,
      documentId: change.documentKey._id,
    });

    try {
      const io = getSocketInstance();

      // Handle different types of changes
      switch (change.operationType) {
        case 'insert':
          this.handleInsert(change, io);
          break;
        case 'update':
          this.handleUpdate(change, io);
          break;
        case 'delete':
          this.handleDelete(change, io);
          break;
        case 'replace':
          this.handleReplace(change, io);
          break;
        default:
          console.log('🔄 Unhandled operation type:', change.operationType);
      }
    } catch (error) {
      console.error('❌ Error handling change:', error);
    }
  }

  private handleInsert(change: ChangeStreamDocument, io: any) {
    const collection = change.ns.coll;
    const document = change.fullDocument;

    console.log(`➕ New document inserted in ${collection}:`, document?._id);

    // Handle different collections
    switch (collection) {
      case 'pollquestions':
        io.emit('question-added', {
          type: 'insert',
          collection: 'questions',
          data: document,
        });
        break;
      case 'users':
        io.emit('user-added', {
          type: 'insert',
          collection: 'users',
          data: document,
        });
        break;
      case 'polls':
        io.emit('poll-added', {
          type: 'insert',
          collection: 'polls',
          data: document,
        });
        break;
      default:
        // Generic event for any collection
        io.emit('data-changed', {
          type: 'insert',
          collection: collection,
          data: document,
        });
    }
  }

  private handleUpdate(change: ChangeStreamDocument, io: any) {
    const collection = change.ns.coll;
    const document = change.fullDocument;
    const documentId = change.documentKey._id;

    console.log(`✏️ Document updated in ${collection}:`, documentId);

    switch (collection) {
      case 'pollquestions':
        io.emit('question-updated', {
          type: 'update',
          collection: 'questions',
          id: documentId,
          data: document,
        });
        break;
      case 'users':
        io.emit('user-updated', {
          type: 'update',
          collection: 'users',
          id: documentId,
          data: document,
        });
        break;
      case 'polls':
        io.emit('poll-updated', {
          type: 'update',
          collection: 'polls',
          id: documentId,
          data: document,
        });
        break;
      default:
        io.emit('data-changed', {
          type: 'update',
          collection: collection,
          id: documentId,
          data: document,
        });
    }
  }

  private handleDelete(change: ChangeStreamDocument, io: any) {
    const collection = change.ns.coll;
    const documentId = change.documentKey._id;

    console.log(`🗑️ Document deleted from ${collection}:`, documentId);

    switch (collection) {
      case 'pollquestions':
        io.emit('question-deleted', {
          type: 'delete',
          collection: 'questions',
          id: documentId,
        });
        break;
      case 'users':
        io.emit('user-deleted', {
          type: 'delete',
          collection: 'users',
          id: documentId,
        });
        break;
      case 'polls':
        io.emit('poll-deleted', {
          type: 'delete',
          collection: 'polls',
          id: documentId,
        });
        break;
      default:
        io.emit('data-changed', {
          type: 'delete',
          collection: collection,
          id: documentId,
        });
    }
  }

  private handleReplace(change: ChangeStreamDocument, io: any) {
    const collection = change.ns.coll;
    const document = change.fullDocument;
    const documentId = change.documentKey._id;

    console.log(`🔄 Document replaced in ${collection}:`, documentId);

    switch (collection) {
      case 'pollquestions':
        io.emit('question-replaced', {
          type: 'replace',
          collection: 'questions',
          id: documentId,
          data: document,
        });
        break;
      default:
        io.emit('data-changed', {
          type: 'replace',
          collection: collection,
          id: documentId,
          data: document,
        });
    }
  }

  private restartWatching() {
    console.log('🔄 Restarting change stream...');
    this.stopWatching();

    // Restart after a short delay
    setTimeout(() => {
      this.startWatching();
    }, 3000);
  }
}

export const mongoChangeWatcher = new MongoDBChangeWatcher();
export default mongoChangeWatcher;
