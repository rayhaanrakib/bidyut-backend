import type { Request, Response } from "express";
import type { z } from "zod";
import type { User } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import * as userService from "./user.service";
import {
  adminProfileSchema,
  customerProfileSchema,
  operatorProfileSchema,
  technicianProfileSchema,
} from "./user.validation";

export const updateProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile((req.user as User).id, req.body);
  sendResponse(res, 200, "Profile updated", { user });
});

export const updateProfileImage = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfileImage((req.user as User).id, req.file);
  sendResponse(res, 200, "Profile image updated", { user });
});

export const getMyProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const profile = await userService.getMyProfile(req.user as User);
  sendResponse(res, 200, "Profile retrieved", { profile });
});

const PROFILE_SCHEMAS: Record<string, z.ZodType<any>> = {
  CUSTOMER: customerProfileSchema,
  FIELD_TECHNICIAN: technicianProfileSchema,
  POWER_OPERATOR: operatorProfileSchema,
  ADMIN: adminProfileSchema,
};

export const updateMyProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const schema = PROFILE_SCHEMAS[(req.user as User).role];
  if (!schema) throw new AppError(400, "No profile exists for this role");
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(400, parsed.error.issues[0]?.message ?? "Invalid profile data");
  const profile = await userService.upsertMyProfile(req.user as User, parsed.data);
  sendResponse(res, 200, "Profile saved", { profile });
});

export const getAllUsers = tryCatchAsync(async (req: Request, res: Response) => {
  const { limit, skip, sortBy, sortOrder, meta } = getPagination(req.query);
  const where: any = { isDeleted: false };

  if ((req.user as User).role === "POWER_OPERATOR")
    where.role = { in: ["CUSTOMER", "FIELD_TECHNICIAN"] };
  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search, mode: "insensitive" } },
      { email: { contains: req.query.search, mode: "insensitive" } },
    ];
  }
  if (req.query.role) where.role = req.query.role;
  if (req.query.status) where.status = req.query.status;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: userService.safeSelect,
    }),
  ]);
  sendResponse(res, 200, "Users retrieved", users, meta(total));
});

export const getSingleUser = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: String(req.params.id), isDeleted: false },
    select: userService.safeSelect,
  });
  if (!user) throw new AppError(404, "User not found");
  sendResponse(res, 200, "User retrieved", { user });
});

export const updateRole = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.adminUpdateRole(
    (req.user as User).id,
    String(req.params.id),
    req.body.role,
  );
  sendResponse(res, 200, "Role updated", { user: { ...user, passwordHash: undefined } });
});

export const updateStatus = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.adminUpdateStatus(
    (req.user as User).id,
    String(req.params.id),
    req.body.status,
  );
  sendResponse(res, 200, "Status updated", { user: { ...user, passwordHash: undefined } });
});

export const softDelete = tryCatchAsync(async (req: Request, res: Response) => {
  await userService.softDeleteUser((req.user as User).id, String(req.params.id));
  sendResponse(res, 200, "User deleted (soft)");
});

export const createStaff = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.createStaff(req.user as User, req.body);
  sendResponse(res, 200, `${user.role} account created`, { user });
});

export const applyAsTechnician = tryCatchAsync(async (req: Request, res: Response) => {
  const profile = await userService.applyAsTechnician(req.user as User, req.file, req.body);
  sendResponse(res, 200, "Application submitted — an admin will review it", profile);
});

export const listTechnicianApplications = tryCatchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await userService.listTechnicianApplications(req.query);
  sendResponse(res, 200, "Technician applications", items, meta);
});

export const decideTechnicianApplication = tryCatchAsync(async (req: Request, res: Response) => {
  const profile = await userService.decideTechnicianApplication(
    req.user as User,
    String(req.params.userId),
    req.body,
  );
  sendResponse(res, 200, `Application ${profile.applicationStatus.toLowerCase()}`, profile);
});
