import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from './handlers';

const clients = new Map<WebSocket, { meetingId: string; speaker: string }>();

export function initializeWebSocketServer(server: import('http').Server | import('https').Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid message received:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });
  });

  return wss;
}
