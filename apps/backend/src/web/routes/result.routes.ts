import { Router } from 'express';
import { createResult, getResults } from '../controllers/result.controller';

const router = Router();

router.post('/', createResult);
router.get('/', getResults);

export default router;
