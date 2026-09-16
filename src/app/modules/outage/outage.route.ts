import { Router } from 'express';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import * as outageController from '@modules/outage/outage.controller';
import { reportOutageSchema } from '@modules/outage/outage.validation';

const router = Router();

router.post('/', checkAuth('CUSTOMER'), validateRequest(reportOutageSchema), outageController.report);
router.get('/', checkAuth(), outageController.list);
router.get('/my-reports', checkAuth('CUSTOMER'), outageController.list);
router.get('/:id', checkAuth(), outageController.getById);

export default router;