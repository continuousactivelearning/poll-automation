// File: apps/backend/src/routes/index.ts

import { Router } from 'express';
import { createOrGetRoom, getCurrentRoom, destroyRoom, getRoomByCode } from '../web/controllers/room.controller';
import { asyncHandler } from '../web/utils/asyncHandler';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();
// Create or get the current room for a host
router.post('/room', asyncHandler(createOrGetRoom));

// Destroy the current room for a host
router.delete('/room', asyncHandler(destroyRoom));

// Get the current room for a host
router.get('/room', asyncHandler(getCurrentRoom));

// Get a room by code (for student join)
router.get('/room/:code', asyncHandler(getRoomByCode));

// Sample test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Transcription route working' });
});

export default router; 