import { User } from '@/generated/prisma/client';
import { prisma } from '@lib/prisma';
import { AppError } from '@utils/AppError';
import { getPagination } from '@utils/pagination';
import { CreateScheduleInput, UpdateScheduleInput } from '@modules/schedule/schedule.interface';
import { logActivity } from '@utils/activity';

const ACTIVE = ['SCHEDULED', 'ONGOING'];

export const createSchedule = async (actor: User, input: CreateScheduleInput) => {
  let feederId = input.feederId ?? null;
  if (input.areaId) {
    const area = await prisma.area.findFirst({ where: { id: input.areaId, isDeleted: false } });
    if (!area) throw new AppError(404, 'Area not found');
    feederId = area.feederId;
  } else {
    const feeder = await prisma.feeder.findFirst({ where: { id: feederId as string, isDeleted: false } });
    if (!feeder) throw new AppError(404, 'Feeder not found');
  }

  const overlap = await prisma.schedule.findFirst({
    where: {
      feederId,
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
  });
  if (overlap) throw new AppError(409, `Time overlaps with existing schedule "${overlap.title}"`);

  const schedule = await prisma.schedule.create({
    data: { ...input, feederId, createdById: actor.id },
  });
  await logActivity('SCHEDULE_CREATED', 'Schedule', schedule.id, actor.id, { feederId });
  return schedule;
};

export const listSchedules = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortBy, sortOrder, meta } = getPagination(query, 'startTime');
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.feederId) where.feederId = query.feederId;
  if (query.areaId) where.areaId = query.areaId;

  const [total, items] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where, skip, take: limit,
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
  if (!schedule) throw new AppError(404, 'Schedule not found');
  return schedule;
};

export const updateSchedule = async (id: string, input: UpdateScheduleInput) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(404, 'Schedule not found');
  if (schedule.status !== 'SCHEDULED') throw new AppError(409, 'Only SCHEDULED schedules can be edited');

  const merged = { ...schedule, ...input };
  const overlap = await prisma.schedule.findFirst({
    where: {
      id: { not: id },
      feederId: schedule.feederId,
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      startTime: { lt: merged.endTime },
      endTime: { gt: merged.startTime },
    },
  });
  if (overlap) throw new AppError(409, 'Updated time overlaps another schedule');

  return prisma.schedule.update({ where: { id }, data: input });
};

export const deleteSchedule = async (id: string) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new AppError(404, 'Schedule not found');
  if (schedule.status === 'ONGOING') throw new AppError(409, 'Cannot delete an ONGOING schedule — cancel it instead');
  await prisma.schedule.delete({ where: { id } });
};