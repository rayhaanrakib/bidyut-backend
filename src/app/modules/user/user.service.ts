import { User } from '@/generated/prisma/client';
import { prisma } from '@lib/prisma';
import { AppError } from '@utils/AppError';
import { cloudinary } from '@lib/cloudinary';

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