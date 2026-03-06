import { Router } from 'express';
import financialReleaseRoutes from './financial-release.routes';
import categoryRoutes from './category.routes';

const router = Router();

router.use('/financial-release', financialReleaseRoutes);
router.use('/category', categoryRoutes);

export default router;
