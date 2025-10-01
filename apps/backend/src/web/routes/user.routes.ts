// // poll-generation-backend/src/routes/user.routes.ts

// import { Router } from 'express';
// import { getProfile } from '../controllers/user.controller';
// import { authenticate } from '../middlewares/auth.middleware';

// const router = Router();

// router.get('/profile', authenticate, getProfile);

// export default router;
// // poll-generation-backend/src/routes/user.routes.ts
// File: apps/backend/src/web/routes/user.routes.ts
import { Router } from 'express';
import multer from 'multer'; // Keep multer
import { 
    getProfile, 
    updateProfile, 
    changePassword, 
    deleteAccount,
    uploadAvatar
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
// --- CRITICAL CHANGE: Use memory storage for cloud uploads ---
const upload = multer({ storage: multer.memoryStorage() });

// All routes are correct. We just use the new upload config.

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile); // This route will handle text fields
// We will now handle the image upload separately via this route.
router.post('/profile/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/change-password', authenticate, changePassword);
router.post('/delete-account', authenticate, deleteAccount);

export default router;