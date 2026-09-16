import { Router } from 'express';
import checkAuth from '@middleware/checkAuth';
import validateRequest from '@middleware/validateRequest';
import {
  zoneController, substationController, feederController, areaController,
} from '@modules/grid/grid.controller';
import {
  zoneSchema, zoneUpdateSchema, substationSchema, substationUpdateSchema,
  feederSchema, feederUpdateSchema, areaSchema, areaUpdateSchema,
} from '@modules/grid/grid.validation';

const router = Router();
const writeAccess = checkAuth('ADMIN', 'POWER_OPERATOR'); 
const readAccess = checkAuth();

// ---- Zones ----
router.post('/zones', writeAccess, validateRequest(zoneSchema), zoneController.create);
router.get('/zones', readAccess, zoneController.list);
router.get('/zones/:id', readAccess, zoneController.getById);
router.patch('/zones/:id', writeAccess, validateRequest(zoneUpdateSchema), zoneController.update);
router.delete('/zones/:id', writeAccess, zoneController.softDelete);

// ---- Substations ----
router.post('/substations', writeAccess, validateRequest(substationSchema), substationController.create);
router.get('/substations', readAccess, substationController.list); // ?zoneId=&search=
router.get('/substations/:id', readAccess, substationController.getById);
router.patch('/substations/:id', writeAccess, validateRequest(substationUpdateSchema), substationController.update);
router.delete('/substations/:id', writeAccess, substationController.softDelete);

// ---- Feeders ----
router.post('/feeders', writeAccess, validateRequest(feederSchema), feederController.create);
router.get('/feeders', readAccess, feederController.list); // ?substationId=&search=
router.get('/feeders/:id', readAccess, feederController.getById);
router.patch('/feeders/:id', writeAccess, validateRequest(feederUpdateSchema), feederController.update);
router.delete('/feeders/:id', writeAccess, feederController.softDelete);

// ---- Areas ----
router.post('/areas', writeAccess, validateRequest(areaSchema), areaController.create);
router.get('/areas', readAccess, areaController.list); // ?feederId=&search=
router.get('/areas/:id', readAccess, areaController.getById);
router.patch('/areas/:id', writeAccess, validateRequest(areaUpdateSchema), areaController.update);
router.delete('/areas/:id', writeAccess, areaController.softDelete);

export default router;