import type { Request, Response } from "express";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import { dispatchNotificationsService } from "./internal.service";

export const dispatchNotifications = tryCatchAsync(async (req: Request, res: Response) => {
  if (req.headers["x-cron-secret"] !== config.cronSecret) {
    throw new AppError(401, "Invalid cron secret");
  }

  const result = await dispatchNotificationsService();

  return sendResponse(res, 200, "Dispatch complete", result);
});
