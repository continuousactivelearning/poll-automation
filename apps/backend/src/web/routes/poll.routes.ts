import { Router } from 'express';
import {
  getPollConfig,
  updateHostSettings,
  addPollQuestion,
} from '../controllers/pollConfigController';

const router = Router();

// Get poll config (host settings + questions)
router.get('/config', getPollConfig);

// Update host settings (without touching questions)
router.put('/config', updateHostSettings);

// Add a poll question
router.post('/questions', addPollQuestion);

export default router;