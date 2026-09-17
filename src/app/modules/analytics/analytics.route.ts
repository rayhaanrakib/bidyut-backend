import { Router } from 'express';
import checkAuth from '@middleware/checkAuth';
import * as analyticsController from '@modules/analytics/analytics.controller';

const router = Router();


router.get('/operational', checkAuth('POWER_OPERATOR', 'ADMIN'), analyticsController.operational);
router.get('/heatmap', checkAuth('POWER_OPERATOR', 'ADMIN'), analyticsController.heatmap); // ?days=30

export default router;