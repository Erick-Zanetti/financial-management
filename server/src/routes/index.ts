import { Router } from 'express';
import financialReleaseRoutes from './financial-release.routes.js';

const router = Router();

router.use('/financial-release', financialReleaseRoutes);

export default router;
