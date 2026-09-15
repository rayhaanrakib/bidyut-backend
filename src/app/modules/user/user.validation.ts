import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, 'Name is too short').optional(),
    category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HEALTHCARE', 'EDUCATION']).optional(),
    areaId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });