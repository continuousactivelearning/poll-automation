// apps/backend/src/web/routes/sessionReport.routes.ts

import { Router } from 'express';
// import { getHostSessionReports, getSessionReportById, getReportBySessionId, getMyJoinedSessionsCount, getMyRecentSessions } from '../controllers/sessionReport.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { getHostSessionReports, getSessionReportById, getReportBySessionId, getMyJoinedSessionsCount, getMyRecentSessions, getStudentPollHistory, getDebugSessionData } from '../controllers/sessionReport.controller';
const router = Router();

router.get('/', authenticate, getHostSessionReports);
// router.get('/:reportId', authenticate, async (req, res, next) => {
//   try {
// 	await getSessionReportById(req, res);
//   } catch (err) {
// 	next(err);
//   }
// });
// router.get('/session/:sessionId', authenticate, async (req, res, next) => {
//   try {
//     await getReportBySessionId(req, res);
//   } catch (err) {
//     next(err);
//   }
// });

// More specific routes first
router.get('/session/:sessionId', authenticate, async (req, res, next) => {
  try {
    await getReportBySessionId(req, res);
  } catch (err) {
    next(err);
  }
});

// Student: get count of sessions joined by the authenticated user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    await getMyJoinedSessionsCount(req, res);
  } catch (err) {
    next(err);
  }
});

// Student: get recent sessions attended
router.get('/me/recent', authenticate, async (req, res, next) => {
  try {
    await getMyRecentSessions(req, res);
  } catch (err) {
    next(err);
  }
});
// Student: get detailed poll history
router.get('/me/polls', authenticate, async (req, res, next) => {
  try {
    await getStudentPollHistory(req, res);
  } catch (err) {
    next(err);
  }
});

// Debug: get raw session data for troubleshooting
router.get('/me/debug', authenticate, async (req, res, next) => {
  try {
    await getDebugSessionData(req, res);
  } catch (err) {
    next(err);
  }
});

// Param route last
router.get('/:reportId', authenticate, async (req, res, next) => {
  try {
    await getSessionReportById(req, res);
  } catch (err) {
    next(err);
  }
});
export default router;