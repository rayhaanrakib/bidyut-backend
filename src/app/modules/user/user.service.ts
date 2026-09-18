import bcrypt from "bcrypt";
import type { Prisma, TechnicianSpecialization, User } from "../../../../generated/prisma/client";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { logActivity } from "../../utils/activity";
import { getPagination } from "../../utils/pagination";
import type { StaffCreateInput } from "./user.interface";

export async function updateProfile(userId: string, input: Record<string, unknown>) {
  return prisma.user.update({ where: { id: userId }, data: input });
}

export async function updateProfileImage(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new AppError(400, 'No image file provided. Send form-data with key "image".');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  if (user.imagePublicId) await cloudinary.uploader.destroy(user.imagePublicId).catch(() => null);

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "bidyut/profiles" }, (error, res) =>
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
  if (!model) throw new AppError(400, "No profile exists for this role");
  return model.findUnique({ where: { userId: actor.id } }); // null until first save
}

export async function upsertMyProfile(actor: User, input: Record<string, unknown>) {
  const model = PROFILE_MODELS[actor.role]?.();
  if (!model) throw new AppError(400, "No profile exists for this role");
  return model.upsert({
    where: { userId: actor.id },
    update: input,
    create: { userId: actor.id, ...input },
  });
}

export const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  category: true,
  areaId: true,
  imageUrl: true,
  mustChangePassword: true,
  slaActive: true,
  slaExpiryDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function adminUpdateRole(actorId: string, userId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) throw new AppError(404, "User not found");
  const updated = await prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  await logActivity("ROLE_CHANGED", "User", userId, actorId, { newRole: role });
  return updated;
}

export async function adminUpdateStatus(actorId: string, userId: string, status: string) {
  if (userId === actorId) throw new AppError(403, "You cannot block or unblock yourself");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) throw new AppError(404, "User not found");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: status as any },
  });
  await logActivity(
    status === "BLOCKED" ? "USER_BLOCKED" : "USER_UNBLOCKED",
    "User",
    userId,
    actorId,
  );

  sendEmail(
    user.email,
    status === "BLOCKED"
      ? "Your BIDYUT account has been blocked"
      : "Your BIDYUT account is active again",
    "account-status",
    { name: user.name, blocked: status === "BLOCKED", frontendUrl: config.server.frontendUrl },
  ).catch(() => null);

  return updated;
}

export async function softDeleteUser(actorId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "ADMIN") throw new AppError(403, "Admin accounts cannot be deleted");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true, deletedAt: new Date(), email: `${user.email}.deleted.${Date.now()}` },
  });
  await logActivity("USER_SOFT_DELETED", "User", userId, actorId);
  return updated;
}

const STAFF_CREATION_POLICY: Record<string, string[]> = {
  ADMIN: ["ADMIN", "POWER_OPERATOR"],
  POWER_OPERATOR: ["FIELD_TECHNICIAN"],
};

function staffProfileCreate(input: StaffCreateInput) {
  const prefix =
    input.role === "FIELD_TECHNICIAN" ? "DES" : input.role === "POWER_OPERATOR" ? "OPS" : "ADM";
  const employeeId = input.employeeId ?? `${prefix}-${Date.now().toString().slice(-6)}`;

  if (input.role === "FIELD_TECHNICIAN") {
    return {
      technicianProfile: {
        create: {
          employeeId,
          specialization: (input.specialization ?? "LINE") as any,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.experienceYears !== undefined
            ? { experienceYears: input.experienceYears }
            : {}),
        },
      },
    };
  }
  if (input.role === "POWER_OPERATOR") {
    return {
      operatorProfile: {
        create: {
          employeeId,
          ...(input.designation ? { designation: input.designation } : {}),
          ...(input.shift ? { shift: input.shift as any } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
        },
      },
    };
  }
  return {
    adminProfile: {
      create: {
        employeeId,
        ...(input.designation ? { designation: input.designation } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
      },
    },
  };
}

export async function createStaff(actor: User, input: StaffCreateInput) {
  const allowedRoles = STAFF_CREATION_POLICY[actor.role] ?? [];
  if (!allowedRoles.includes(input.role)) {
    throw new AppError(403, `A ${actor.role} cannot create a ${input.role} account`);
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as any,
      authProvider: "CREDENTIAL",
      emailVerified: true,
      passwordRequired: true,
      mustChangePassword: true,
      ...staffProfileCreate(input),
    },
    select: safeSelect,
  });

  await logActivity("STAFF_ACCOUNT_CREATED", "User", user.id, actor.id, { role: input.role });
  await sendEmail(input.email, "⚡ Your BIDYUT staff account", "staff-welcome", {
    name: input.name,
    role: input.role,
  }).catch(() => null);

  return user;
}

export const applyAsTechnician = async (
  customer: User,
  file: Express.Multer.File | undefined,
  input: {
    specialization?: string;
    experienceYears?: number;
    certification?: string;
    phone?: string;
  },
) => {
  if (customer.role !== "CUSTOMER")
    throw new AppError(409, "Only customer accounts can apply as technicians");

  const existing = await prisma.technicianProfile.findUnique({ where: { userId: customer.id } });
  if (existing) {
    if (existing.applicationStatus === "PENDING")
      throw new AppError(409, "Your application is already under review");
    if (existing.applicationStatus === "APPROVED")
      throw new AppError(409, "You are already an approved technician");
  }

  if (!file) throw new AppError(400, 'No resume file provided. Send form-data with key "resume".');

  const upload = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "bidyut/resumes" }, (error, res) =>
      error ? reject(error) : resolve(res),
    );
    stream.end(file.buffer);
  });

  const fields = {
    specialization: (input.specialization ?? "LINE") as TechnicianSpecialization,
    experienceYears: input.experienceYears,
    certification: input.certification,
    phone: input.phone,
    resumeUrl: upload.secure_url,
    resumePublicId: upload.public_id,
    applicationStatus: "PENDING" as const,
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
  };

  const profile = existing
    ? await prisma.technicianProfile.update({
        where: { userId: customer.id },
        data: fields satisfies Prisma.TechnicianProfileUncheckedUpdateInput,
      })
    : await prisma.technicianProfile.create({
        data: {
          userId: customer.id,
          ...fields,
        } satisfies Prisma.TechnicianProfileUncheckedCreateInput,
      });

  await logActivity("TECHNICIAN_APPLICATION_SUBMITTED", "User", customer.id, customer.id);
  return profile;
};

export const listTechnicianApplications = async (query: Record<string, unknown>) => {
  const { limit, skip, sortBy, sortOrder, meta } = getPagination(query);
  const where: any = { applicationStatus: query.status ?? "PENDING" }; // ?status=PENDING|APPROVED|REJECTED
  const [items, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where,
      include: { user: { select: safeSelect } },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.technicianProfile.count({ where }),
  ]);
  return { items, meta: meta(total) };
};

export const decideTechnicianApplication = async (
  admin: User,
  userId: string,
  input: { applicationStatus: "APPROVED" | "REJECTED"; rejectionReason?: string },
) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) throw new AppError(404, "No technician application found for this user");
  if (profile.applicationStatus !== "PENDING")
    throw new AppError(
      409,
      `This application was already ${profile.applicationStatus.toLowerCase()}`,
    );
  if (input.applicationStatus === "REJECTED" && !input.rejectionReason) {
    throw new AppError(400, "A rejection reason is required when rejecting an application");
  }

  const decided = await prisma.$transaction(async (tx) => {
    const updated = await tx.technicianProfile.update({
      where: { userId },
      data: {
        applicationStatus: input.applicationStatus,
        rejectionReason: input.applicationStatus === "REJECTED" ? input.rejectionReason : null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        ...(input.applicationStatus === "APPROVED"
          ? { employeeId: profile.employeeId ?? `DES-${Date.now().toString().slice(-6)}` }
          : {}),
      },
    });
    if (input.applicationStatus === "APPROVED") {
      await tx.user.update({ where: { id: userId }, data: { role: "FIELD_TECHNICIAN" } });
    }
    await tx.activityLog.create({
      data: {
        action: "TECHNICIAN_APPLICATION_DECIDED",
        entity: "User",
        entityId: userId,
        actorId: admin.id,
        metadata: { applicationStatus: input.applicationStatus } as any,
      },
    });
    return updated;
  });

  await sendEmail(
    profile.user.email,
    input.applicationStatus === "APPROVED"
      ? "⚡ Your BIDYUT technician application was approved"
      : "Your BIDYUT technician application — update",
    "technician-application",
    {
      name: profile.user.name,
      approved: input.applicationStatus === "APPROVED",
      reason: input.rejectionReason,
    },
  ).catch(() => null);

  return decided;
};
