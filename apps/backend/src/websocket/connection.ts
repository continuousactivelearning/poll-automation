// // websocket/connection.ts
// import { WebSocketServer, WebSocket } from 'ws'; // Make sure WebSocket is imported for typing
// import { handleSocketMessage, removeConnectionMeta } from './handlers'; // <-- Import removeConnectionMeta

// // Define a type for WebSocket with an 'isAlive' property
// interface CustomWebSocket extends WebSocket {
//     isAlive: boolean;
// }

// export const setupWebSocketServer = (server: import('http').Server) => {
//     const wss = new WebSocketServer({ server });

//     // Store active connections for managing them (e.g., for ping/pong)
//     const clients = new Set<CustomWebSocket>();

//     wss.on('connection', (ws: CustomWebSocket) => { // Cast ws to CustomWebSocket
//         console.log("[Backend WS] Client connected");
//         clients.add(ws);

//         // --- START Heartbeat for individual client connection ---
//         ws.isAlive = true; // Initialize isAlive status for the new connection
//         ws.on('pong', () => {
//             ws.isAlive = true; // Mark as alive when a pong is received
//         });
//         // --- END Heartbeat for individual client connection ---

//         ws.on('message', (data, isBinary) => {
//             console.log(`[Backend WS] Message received (${isBinary ? "binary" : "text"})`);
//             // Delegate message handling to handlers.ts
//             handleSocketMessage(ws, data, isBinary);
//         });

//         ws.on('close', () => {
//             console.log("[Backend WS] Client disconnected");
//             clients.delete(ws); // Remove this specific client from the set

//             // *** IMPORTANT ***
//             // Call the cleanup function from handlers.ts when a client disconnects.
//             // This ensures the associated Whisper connection is also closed and session data cleared.
//             removeConnectionMeta(ws);
//         });

//         ws.on('error', (err) => {
//             console.error("[Backend WS] Error:", err);
//             // Handle specific errors for this client connection
//             // Error typically leads to 'onclose', which will then trigger removeConnectionMeta
//         });
//     });

//     // Add a handler for server-level errors if needed
//     wss.on('error', (error) => {
//         console.error("[Backend WS] WebSocket Server error:", error);
//     });

//     console.log('[Backend WS] WebSocket server setup complete.');

//     // --- START Periodically check for dead connections (Heartbeat for all clients) ---
//     const interval = setInterval(() => {
//         clients.forEach((ws: CustomWebSocket) => { // Iterate over all connected clients
//             if (ws.isAlive === false) { // If a client didn't respond to the last ping
//                 console.log('[Backend WS] Terminating dead client connection.');
//                 return ws.terminate(); // Force close the connection
//             }

//             ws.isAlive = false; // Mark as not alive, expecting a pong
//             ws.ping(); // Send a ping frame to the client
//         });
//     }, 30000); // Ping every 30 seconds

//     // When the WebSocket server itself is closed (e.g., due to process exit)
//     wss.on('close', () => {
//         console.log('[Backend WS] WebSocket server shutting down, clearing ping interval.');
//         clearInterval(interval); // Clear the heartbeat interval
//     });
//     // --- END Periodically check for dead connections ---

//     // Optional: Graceful shutdown of the entire Node.js server
//     // This part should generally be in your main application entry file (e.g., `apps/backend/src/index.ts` or `app.ts`)
//     // where `setupWebSocketServer` is called. However, it's included here for completeness
//     // if this file is the primary orchestration point.
//     process.on('SIGINT', () => {
//         console.log('[Backend WS] Received SIGINT. Shutting down WebSocket server gracefully...');
//         wss.close(() => {
//             console.log('[Backend WS] WebSocket server closed.');
//             // This is where you might also trigger cleanup for all active Whisper connections
//             // if they are managed globally rather than per-client.
//             // For per-client, removeConnectionMeta should handle it.
//             process.exit(0);
//         });
//         // Set a timeout to force exit if graceful shutdown takes too long
//         setTimeout(() => {
//             console.warn('[Backend WS] Forced exit after graceful shutdown timeout.');
//             clients.forEach(ws => ws.terminate()); // Terminate any remaining connections
//             process.exit(1);
//         }, 5000); // 5 seconds timeout
//     });
// };