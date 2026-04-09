import { Router } from 'express';
import financialReleaseRoutes from './financial-release.routes';
import categoryRoutes from './category.routes';
import systemConfigRoutes from './system-config.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/financial-release', financialReleaseRoutes);
router.use('/category', categoryRoutes);
router.use('/system-config', systemConfigRoutes);
router.use('/ai', aiRoutes);

export default router;
