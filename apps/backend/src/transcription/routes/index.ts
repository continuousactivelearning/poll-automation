import { Router } from 'express';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();

router.get('/test', (req, res) => {
  res.json({ message: 'Transcription route working' });
});

export default router;