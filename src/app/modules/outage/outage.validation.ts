import { z } from 'zod';

export const reportOutageSchema = z.object({
  areaId: z.string().uuid('areaId must be a valid id'),
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10, 'Describe the problem in at least 10 characters'),
});
