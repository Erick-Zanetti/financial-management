import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { asyncHandler } from '../utils/async-handler';
import { upload } from '../config/multer.config';

const router = Router();

router.post(
  '/process-pdf',
  upload.single('pdf'),
  asyncHandler(aiController.processPdf.bind(aiController)),
);

export default router;
