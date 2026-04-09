import { Router } from 'express';
import { systemConfigController } from '../controllers/system-config.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get(
  '/',
  asyncHandler(systemConfigController.get.bind(systemConfigController)),
);

router.patch(
  '/',
  asyncHandler(systemConfigController.update.bind(systemConfigController)),
);

export default router;
