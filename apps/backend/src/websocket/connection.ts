// connection.ts
import { WebSocketServer } from 'ws';
import { handleSocketMessage } from './handlers';

export const setupWebSocketServer = (server: import('http').Server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log("[Backend WS] Client connected");

    ws.on('message', (data, isBinary) => {
      console.log(`[Backend WS] Message received (${isBinary ? "binary" : "text"})`);
      handleSocketMessage(ws, data, isBinary);
    });

    ws.on('close', () => {
      console.log("[Backend WS] Client disconnected");
    });

    ws.on('error', (err) => {
      console.error("[Backend WS] Error:", err);
    });
  });
};
