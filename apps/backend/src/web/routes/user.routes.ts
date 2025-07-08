import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from "multer";
import path from "path";
import { uploadAvatar } from "../controllers/user.controller";

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile); // <-- added this line

export default router;
