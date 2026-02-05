import { Router } from 'express';
import financialReleaseRoutes from './financial-release.routes';

const router = Router();

router.use('/financial-release', financialReleaseRoutes);

export default router;
