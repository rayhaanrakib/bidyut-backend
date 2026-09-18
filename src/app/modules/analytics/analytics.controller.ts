import type { Request, Response } from "express";
import type { User } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { getPagination } from "../../utils/pagination";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import * as analyticsService from "./analytics.service";

export const operational = tryCatchAsync(async (_req: Request, res: Response) => {
  const data = await analyticsService.operationalStats();
  sendResponse(res, 200, "Operational stats", data);
});

export const heatmap = tryCatchAsync(async (req: Request, res: Response) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.heatmap(days);
  sendResponse(res, 200, "Outage heatmap", data);
});

export const mySummary = tryCatchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.customerSummary((req.user as User).id);
  sendResponse(res, 200, "Your summary", data);
});

export const technicianSummary = tryCatchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.technicianSummary((req.user as User).id);
  sendResponse(res, 200, "Performance summary", data);
});

export const activityLogs = tryCatchAsync(async (req: Request, res: Response) => {
  const { limit, skip, meta } = getPagination(req.query);
  const where: any = {};
  if (req.query.action) where.action = { contains: req.query.action, mode: "insensitive" };
  if (req.query.entity) where.entity = req.query.entity;

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
  ]);
  sendResponse(res, 200, "Activity logs retrieved", logs, meta(total));
});
