import type { Request, Response } from "express";
import type { z } from "zod";
import type { User } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
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
  res.json({ success: true, message: "Profile updated", data: { user } });
});

export const updateProfileImage = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfileImage((req.user as User).id, req.file);
  res.json({ success: true, message: "Profile image updated", data: { user } });
});

export const getMyProfile = tryCatchAsync(async (req: Request, res: Response) => {
  const profile = await userService.getMyProfile(req.user as User);
  res.json({ success: true, message: "Profile retrieved", data: { profile } });
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
  res.json({ success: true, message: "Profile saved", data: { profile } });
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
  res.json({ success: true, message: "Users retrieved", data: users, meta: meta(total) });
});

export const getSingleUser = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: String(req.params.id), isDeleted: false },
    select: userService.safeSelect,
  });
  if (!user) throw new AppError(404, "User not found");
  res.json({ success: true, message: "User retrieved", data: { user } });
});

export const updateRole = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.adminUpdateRole(
    (req.user as User).id,
    String(req.params.id),
    req.body.role,
  );
  res.json({
    success: true,
    message: "Role updated",
    data: { user: { ...user, passwordHash: undefined } },
  });
});

export const updateStatus = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.adminUpdateStatus(
    (req.user as User).id,
    String(req.params.id),
    req.body.status,
  );
  res.json({
    success: true,
    message: "Status updated",
    data: { user: { ...user, passwordHash: undefined } },
  });
});

export const softDelete = tryCatchAsync(async (req: Request, res: Response) => {
  await userService.softDeleteUser((req.user as User).id, String(req.params.id));
  res.json({ success: true, message: "User deleted (soft)" });
});

export const createStaff = tryCatchAsync(async (req: Request, res: Response) => {
  const user = await userService.createStaff(req.user as User, req.body);
  res.status(201).json({ success: true, message: `${user.role} account created`, data: { user } });
});
