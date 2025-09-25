import { Router } from 'express';
import {
  getPollConfig,
  updateHostSettings,
  addPollQuestion,
} from '../controllers/pollConfigController';

const router = Router();

router.get('/', getPollConfig);
router.post('/settings', updateHostSettings);
router.post('/question', addPollQuestion);

export default router;
