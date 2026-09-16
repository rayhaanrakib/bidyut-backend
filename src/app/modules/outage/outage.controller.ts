import { Request, Response } from 'express';
import * as outageService from '@modules/outage/outage.service';

import { tryCatchAsync } from '@utils/tryCatchAsync';
import { sendResponse } from '@utils/sendResponse';
export const report = tryCatchAsync(async (req: Request, res: Response) => {
  const report = await outageService.reportOutage(req.user!, req.body);
  sendResponse(res, 201, 'Outage reported', report);
});

export const list = tryCatchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await outageService.listForRole(req.user!, req.query);
  sendResponse(res, 200, 'Outage reports retrieved', items, meta);
});

export const getById = tryCatchAsync(async (req: Request, res: Response) => {
  const report = await outageService.getByIdScoped(req.user!, req.params.id as string);
  sendResponse(res, 200, 'Outage report retrieved', report);
});


export const updateStatus = tryCatchAsync(async (req: Request, res: Response) => {
  const report = await outageService.updateStatus(req.user!, req.params.id as string, req.body.status);
  sendResponse(res, 200, `Status updated to ${report.status}`, report);
});


export const assign = tryCatchAsync(async (req: Request, res: Response) => {
  const report = await outageService.assignTechnician(req.user!, req.params.id as string, req.body.technicianId);
  sendResponse(res, 200, 'Technician assigned', report);
});
