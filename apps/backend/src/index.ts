import express from 'express';
import { createServer } from 'http';
import transcriptionRoutes from './transcription/routes';
import webRoutes from './web/routes';
import { initializeWebSocketServer } from './websocket/connection';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/transcription', transcriptionRoutes);
app.use('/api', webRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

initializeWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running with WebSocket on port ${PORT}`);
});

export { app };