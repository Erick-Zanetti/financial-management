import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { asyncHandler } from '../utils/async-handler';
import { upload } from '../config/multer.config';

const router = Router();

router.post(
  '/process-file',
  upload.single('file'),
  asyncHandler(aiController.processPdf.bind(aiController)),
);

export default router;
