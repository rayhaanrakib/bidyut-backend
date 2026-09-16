import { Router } from 'express';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import * as scheduleController from '@modules/schedule/schedule.controller';
import { createScheduleSchema, updateScheduleSchema } from '@modules/schedule/schedule.validation';

const router = Router();
const writeAccess = checkAuth('ADMIN', 'POWER_OPERATOR');

router.post('/', writeAccess, validateRequest(createScheduleSchema), scheduleController.create);
router.get('/', checkAuth(), scheduleController.list);
router.get('/:id', checkAuth(), scheduleController.getById);
router.patch('/:id', writeAccess, validateRequest(updateScheduleSchema), scheduleController.update);
router.delete('/:id', writeAccess, scheduleController.remove);

export default router;