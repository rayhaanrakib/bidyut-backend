import { z } from 'zod';

const scheduleBase = z.object({
  title: z.string().min(3, 'Title is too short'),
  reason: z.string().optional(),
  type: z.enum(['PLANNED', 'MAINTENANCE', 'EMERGENCY']),
  feederId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  startTime: z.coerce.date(), // accepts an ISO string like "2025-09-10T02:00:00.000Z"
  endTime: z.coerce.date(),
});

export const createScheduleSchema = scheduleBase
  .refine((d) => d.endTime > d.startTime, { message: 'endTime must be after startTime' })
  .refine((d) => Boolean(d.feederId || d.areaId), { message: 'Provide a feederId or an areaId' });

export const updateScheduleSchema = scheduleBase.partial().refine(
  (d) => (d.startTime && d.endTime ? d.endTime > d.startTime : true),
  { message: 'endTime must be after startTime' },
);
export const updateScheduleStatusSchema = z.object({
  status: z.enum(['ONGOING', 'COMPLETED', 'CANCELLED']),
});