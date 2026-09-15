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

  // delete the old image — its Cloudinary public id lives in its own column (no URL parsing)
  if (user.imagePublicId) await cloudinary.uploader.destroy(user.imagePublicId).catch(() => null);

  // upload the new image from the memory buffer
  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'bidyut/profiles' }, (error, res) =>
      error ? reject(error) : resolve(res),
    );
    stream.end(file.buffer);
  });

  // keep BOTH values — the url for display, the public id for the next deletion
  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl: result.secure_url, imagePublicId: result.public_id },
  });
}