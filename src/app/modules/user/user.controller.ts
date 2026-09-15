import { Request, Response } from 'express';
import * as userService from '@modules/user/user.service';
import { z } from 'zod';
import { adminProfileSchema, customerProfileSchema, operatorProfileSchema, technicianProfileSchema } from '@modules/user/user.validation';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { AppError } from '@utils/AppError';

export const updateProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

export const updateProfileImage = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfileImage(req.user!.id, req.file);
  res.json({ success: true, message: 'Profile image updated', data: { user } });
});

export const getMyProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const profile = await userService.getMyProfile(req.user!);
  res.json({ success: true, message: 'Profile retrieved', data: { profile } });
});

const PROFILE_SCHEMAS: Record<string, z.ZodType<any>> = {
  CUSTOMER: customerProfileSchema,
  FIELD_TECHNICIAN: technicianProfileSchema,
  POWER_OPERATOR: operatorProfileSchema,
  ADMIN: adminProfileSchema,
};

export const updateMyProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const schema = PROFILE_SCHEMAS[req.user!.role];
  if (!schema) throw new AppError(400, 'No profile exists for this role');
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Invalid profile data');
  const profile = await userService.upsertMyProfile(req.user!, parsed.data);
  res.json({ success: true, message: 'Profile saved', data: { profile } });
});
