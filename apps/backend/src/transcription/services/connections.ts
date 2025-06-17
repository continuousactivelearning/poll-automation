/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from '../../websocket/handlers';
import { ConnectionMessage } from '@poll-automation/types';

// Extend WebSocket type to include isAlive property
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

// Store connections with their metadata
const connections = new Map<WebSocket, { meetingId: string; speakerId: string; role: string }>();

// Add a new connection to the store
export function addConnection(ws: WebSocket, meetingId: string, speakerId: string, role: string) {
  connections.set(ws, { meetingId, speakerId, role });
  console.log(`Added connection for speaker ${speakerId} in meeting ${meetingId}`);
}

// Remove a connection from the store
export function removeConnection(ws: WebSocket) {
  const connection = connections.get(ws);
  if (connection) {
    console.log(`Removed connection for speaker ${connection.speakerId} in meeting ${connection.meetingId}`);
  }
  connections.delete(ws);
}

// Add this function to broadcast messages to all clients in a meeting
export function broadcastToMeeting(meetingId: string, message: string) {
  connections.forEach((metadata, ws) => {
    if (metadata.meetingId === meetingId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Add this function to get connections for a specific meeting
export function getMeetingConnections(meetingId: string) {
  const meetingConnections = new Map<string, { ws: WebSocket; role: string }>();
  
  connections.forEach((metadata, ws) => {
    if (metadata.meetingId === meetingId) {
      meetingConnections.set(metadata.speakerId, { ws, role: metadata.role });
    }
  });
  
  return meetingConnections;
}

export function initializeWebSocketServer(server: import('http').Server | import('https').Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    (ws as ExtendedWebSocket).isAlive = true; // Add for health checking
    ws.on('pong', () => { (ws as ExtendedWebSocket).isAlive = true; });

    ws.on('message', (data: Buffer) => {
  try {
    const message = JSON.parse(data.toString());
    if (message.type === 'connection') {
      const { meetingId, speakerId, role } = message as ConnectionMessage;
      (ws as any).meetingId = meetingId; // Store for cleanup
      (ws as any).speakerId = speakerId;
      addConnection(ws, meetingId, speakerId, role);
      ws.send(JSON.stringify({ type: 'connection_ack', meetingId, speakerId }));
    } else {
      handleMessage(ws, message);
    }
  } catch (error) {
    console.error('Invalid message received:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
  }
});

ws.on('close', () => {
  console.log('Client disconnected');
  const meetingId = (ws as any).meetingId;
  const speakerId = (ws as any).speakerId;
  if (meetingId && speakerId) {
    removeConnection(ws);
  }
});

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Health check: Ping clients periodically
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      if ((ws as ExtendedWebSocket).isAlive === false) {
        ws.terminate();
        // Cleanup will be handled by 'close' event
      } else {
        (ws as ExtendedWebSocket).isAlive = false;
        ws.ping();
      }
    });
  }, 30000); // Ping every 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
