import { Request, Response } from 'express';
import * as scheduleService from '@modules/schedule/schedule.service';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { sendResponse } from '@utils/sendResponse';

export const create = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.createSchedule(req.user!, req.body);
  sendResponse(res, 201, 'Schedule published', schedule);
});

export const list = tryCatchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await scheduleService.listSchedules(req.query);
  sendResponse(res, 200, 'Schedules retrieved', items, meta);
});

export const getById = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.getScheduleById(req.params.id as string);
  sendResponse(res, 200, 'Schedule retrieved', schedule);
});

export const update = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.updateSchedule(req.params.id as string, req.body);
  sendResponse(res, 200, 'Schedule updated', schedule);
});

export const remove = tryCatchAsync(async (req: Request, res: Response) => {
  await scheduleService.deleteSchedule(req.params.id as string);
  sendResponse(res, 200, 'Schedule deleted');
});

export const updateStatus = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.updateScheduleStatus(req.user!, req.params.id as string, req.body.status);
  sendResponse(res, 200, `Schedule status updated to ${schedule.status}`, schedule);
});
