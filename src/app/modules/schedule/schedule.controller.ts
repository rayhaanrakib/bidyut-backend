import type { Request, Response } from "express";
import type { User } from "../../../../generated/prisma/client";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import * as scheduleService from "./schedule.service";

export const create = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.createSchedule(req.user as User, req.body);
  sendResponse(res, 201, "Schedule published", schedule);
});

export const list = tryCatchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await scheduleService.listSchedules(req.query);
  sendResponse(res, 200, "Schedules retrieved", items, meta);
});

export const getById = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.getScheduleById(req.params.id as string);
  sendResponse(res, 200, "Schedule retrieved", schedule);
});

export const update = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.updateSchedule(req.params.id as string, req.body);
  sendResponse(res, 200, "Schedule updated", schedule);
});

export const remove = tryCatchAsync(async (req: Request, res: Response) => {
  await scheduleService.deleteSchedule(req.params.id as string);
  sendResponse(res, 200, "Schedule deleted");
});

export const updateStatus = tryCatchAsync(async (req: Request, res: Response) => {
  const schedule = await scheduleService.updateScheduleStatus(
    req.user as User,
    req.params.id as string,
    req.body.status,
  );
  sendResponse(res, 200, `Schedule status updated to ${schedule.status}`, schedule);
});
