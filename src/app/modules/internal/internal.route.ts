import { Router } from 'express';
import { dispatchNotifications } from '@modules/internal/internal.controller';

const router = Router();
router.post('/dispatch-notifications', dispatchNotifications);

export default router;