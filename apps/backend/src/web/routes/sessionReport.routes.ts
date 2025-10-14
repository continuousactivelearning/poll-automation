// apps/backend/src/web/routes/sessionReport.routes.ts

import { Router } from 'express';
import { getHostSessionReports, getSessionReportById, getReportBySessionId } from '../controllers/sessionReport.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getHostSessionReports);
router.get('/:reportId', authenticate, async (req, res, next) => {
  try {
	await getSessionReportById(req, res);
  } catch (err) {
	next(err);
  }
});
router.get('/session/:sessionId', authenticate, async (req, res, next) => {
  try {
    await getReportBySessionId(req, res);
  } catch (err) {
    next(err);
  }
});


export default router;