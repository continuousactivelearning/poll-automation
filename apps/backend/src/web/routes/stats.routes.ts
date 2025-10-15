import { Router } from 'express';
import { getHostStats } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Returns host-specific dashboard stats
router.get('/host', authenticate, (req, res, next) => {
	getHostStats(req, res).catch(next);
});

export default router;