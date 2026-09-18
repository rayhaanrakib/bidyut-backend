import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { logActivity } from "../../utils/activity";
import { getPagination } from "../../utils/pagination";
import type { CreateScheduleInput, UpdateScheduleInput } from "./schedule.interface";

// const ACTIVE = ['SCHEDULED', 'ONGOING'];
const MINUTE = 60_000;
const DAY = 86_400_000;

export const createSchedule = async (actor: User, input: CreateScheduleInput) => {
  let feederId = input.feederId ?? null;
  if (input.areaId) {
    const area = await prisma.area.findFirst({ where: { id: input.areaId, isDeleted: false } });
    if (!area) throw new AppError(404, "Area not found");
    feederId = area.feederId;
  } else {
    const feeder = await prisma.feeder.findFirst({
      where: { id: feederId as string, isDeleted: false },
    });
    if (!feeder) throw new AppError(404, "Feeder not found");
  }

  const overlap = await prisma.schedule.findFirst({
    where: {
      feederId,
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
  });
  if (overlap) throw new AppError(409, `Time overlaps with existing schedule "${overlap.title}"`);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // back to Monday
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY);

  const weekSchedules = await prisma.schedule.findMany({
    where: {
      feederId,
      status: { notIn: ["CANCELLED"] },
      startTime: { gte: weekStart, lt: weekEnd },
    },
  });
  const usedMinutes = weekSchedules.reduce(
    (sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()) / MINUTE,
    0,
  );
  const newMinutes = (input.endTime.getTime() - input.startTime.getTime()) / MINUTE;

  if (usedMinutes + newMinutes > config.weeklyCapMinutes) {
    throw new AppError(
      409,
      `Weekly cap exceeded: feeder already has ${Math.round(usedMinutes)} of ${config.weeklyCapMinutes} shed minutes this week`,
    );
  }
  const schedule = await prisma.schedule.create({
    data: { ...input, feederId, createdById: actor.id },
  });
  await logActivity("SCHEDULE_CREATED", "Schedule", schedule.id, actor.id, { feederId });
  return schedule;
};

export const listSchedules = async (query: Record<string, unknown>) => {
  const { limit, skip, sortBy, sortOrder, meta } = getPagination(query, "startTime");
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.feederId) where.feederId = query.feederId;
  if (query.areaId) where.areaId = query.areaId;

  const [total, items] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { feeder: { select: { name: true } }, area: { select: { name: true } } },
    }),
  ]);
  return { items, meta: meta(total) };
};

export const getScheduleById = async (id: string) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { feeder: { select: { name: true } }, area: { select: { name: true } } },
  });
  if (!schedule) throw new AppError(404, "Schedule not found");
  return schedule;
};

export const updateSchedule = async (id: string, input: UpdateScheduleInput) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(404, "Schedule not found");
  if (schedule.status !== "SCHEDULED")
    throw new AppError(409, "Only SCHEDULED schedules can be edited");

  const merged = { ...schedule, ...input };
  const overlap = await prisma.schedule.findFirst({
    where: {
      id: { not: id },
      feederId: schedule.feederId,
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      startTime: { lt: merged.endTime },
      endTime: { gt: merged.startTime },
    },
  });
  if (overlap) throw new AppError(409, "Updated time overlaps another schedule");

  return prisma.schedule.update({ where: { id }, data: input });
};

export const deleteSchedule = async (id: string) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(404, "Schedule not found");
  if (schedule.status === "ONGOING")
    throw new AppError(409, "Cannot delete an ONGOING schedule — cancel it instead");
  await prisma.schedule.delete({ where: { id } });
};

const NEXT_SCHEDULE_STATUS: Record<string, string[]> = {
  SCHEDULED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const updateScheduleStatus = async (actor: User, id: string, newStatus: string) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(404, "Schedule not found");

  const allowed = NEXT_SCHEDULE_STATUS[schedule.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      409,
      `Invalid transition: ${schedule.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`,
    );
  }

  const updated = await prisma.schedule.update({
    where: { id },
    data: { status: newStatus as any },
  });
  await logActivity("SCHEDULE_STATUS_CHANGED", "Schedule", id, actor.id, { newStatus });
  return updated;
};
