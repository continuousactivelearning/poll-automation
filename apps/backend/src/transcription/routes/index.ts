import { Router } from 'express';
import { createOrGetRoom, getCurrentRoom, destroyRoom, getRoomByCode } from '../../web/controllers/room.controller';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();
// Create or get the current room for a host
router.post('/room', createOrGetRoom);

// Destroy the current room for a host
router.delete('/room', destroyRoom);

// Get the current room for a host
router.get('/room', getCurrentRoom);

// Get a room by code (for student join)
router.get('/room/:code', getRoomByCode);

// Sample test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Transcription route working' });
});

export default router; 