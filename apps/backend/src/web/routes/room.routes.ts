// File: apps/backend/src/web/routes/room.routes.ts
import { Router } from 'express';
import { createRoom, inviteStudents, getActiveRoomByCode,getActiveRoomForHost,getLiveParticipants  } from '../controllers/room.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticate, (req, res, next) => {
  Promise.resolve(createRoom(req, res)).catch(next);
});
router.post('/:roomId/invite', authenticate, upload.single('studentsFile'), (req, res, next) => {
  Promise.resolve(inviteStudents(req, res)).catch(next);
});
router.get('/:code', authenticate, (req, res, next) => {
  Promise.resolve(getActiveRoomByCode(req, res)).catch(next);
});
router.get('/current', authenticate, (req, res, next) => {
  Promise.resolve(getActiveRoomForHost(req, res)).catch(next);
});
router.get('/:roomId/participants', authenticate, (req, res, next) => {
  Promise.resolve(getLiveParticipants(req, res)).catch(next);
});


export default router;