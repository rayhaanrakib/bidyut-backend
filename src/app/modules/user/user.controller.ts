import { Request, Response } from 'express';
import * as userService from '@modules/user/user.service';

import { tryCatchAsync } from '@utils/tryCatchAsync';
export const updateProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

export const updateProfileImage = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfileImage(req.user!.id, req.file);
  res.json({ success: true, message: 'Profile image updated', data: { user } });
});
