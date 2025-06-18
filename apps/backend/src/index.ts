import express from 'express';
import http from 'http';
import { setupWebSocketServer } from './websocket/connection';
import hostSettingsRouter from './host-settings/routes';
import dotenv from 'dotenv';
import cors from 'cors'; 

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors()); 
app.use(express.json());

app.use('/api/host-settings', hostSettingsRouter); 
app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

setupWebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});