import { User } from '@/generated/prisma/client';
import { prisma } from '@lib/prisma';
import { AppError } from '@utils/AppError';
import { cloudinary } from '@lib/cloudinary';
import config from '@app/config';
import { logActivity } from '@utils/activity';
import { sendEmail } from '@lib/nodemailer';

export async function updateProfile(userId: string, input: Record<string, unknown>) {
  return prisma.user.update({ where: { id: userId }, data: input });
}

export async function updateProfileImage(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new AppError(400, 'No image file provided. Send form-data with key "image".');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  if (user.imagePublicId) await cloudinary.uploader.destroy(user.imagePublicId).catch(() => null);

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'bidyut/profiles' }, (error, res) =>
      error ? reject(error) : resolve(res),
    );
    stream.end(file.buffer);
  });

  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl: result.secure_url, imagePublicId: result.public_id },
  });
}

const PROFILE_MODELS: Record<string, any> = {
  CUSTOMER: () => prisma.customerProfile,
  FIELD_TECHNICIAN: () => prisma.technicianProfile,
  POWER_OPERATOR: () => prisma.operatorProfile,
  ADMIN: () => prisma.adminProfile,
};

export async function getMyProfile(actor: User) {
  const model = PROFILE_MODELS[actor.role]?.();
  if (!model) throw new AppError(400, 'No profile exists for this role');
  return model.findUnique({ where: { userId: actor.id } }); // null until first save
}

export async function upsertMyProfile(actor: User, input: Record<string, unknown>) {
  const model = PROFILE_MODELS[actor.role]?.();
  if (!model) throw new AppError(400, 'No profile exists for this role');
  return model.upsert({
    where: { userId: actor.id },
    update: input,
    create: { userId: actor.id, ...input },
  });
}


export const safeSelect = {
  id: true, name: true, email: true, role: true, status: true, category: true,
  areaId: true, imageUrl: true, mustChangePassword: true, slaActive: true, slaExpiryDate: true,
  createdAt: true, updatedAt: true,
} as const;

export async function adminUpdateRole(actorId: string, userId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  const updated = await prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  await logActivity('ROLE_CHANGED', 'User', userId, actorId, { newRole: role });
  return updated;
}

export async function adminUpdateStatus(actorId: string, userId: string, status: string) {
  if (userId === actorId) throw new AppError(403, 'You cannot block or unblock yourself');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: status as any } });
  await logActivity(status === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 'User', userId, actorId);

  // 📩 governance email — the user hears this from US, not from a failed login
  sendEmail(
    user.email,
    status === 'BLOCKED' ? 'Your BIDYUT account has been blocked' : 'Your BIDYUT account is active again',
    'account-status',
    { name: user.name, blocked: status === 'BLOCKED', frontendUrl: config.server.frontendUrl },
  ).catch(() => null);

  return updated;
}

export async function softDeleteUser(actorId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.role === 'ADMIN') throw new AppError(403, 'Admin accounts cannot be deleted');

  // email must stay unique, so rename it — history is preserved, the account is unusable
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true, deletedAt: new Date(), email: `${user.email}.deleted.${Date.now()}`},
  });
  await logActivity('USER_SOFT_DELETED', 'User', userId, actorId);
  return updated;
}