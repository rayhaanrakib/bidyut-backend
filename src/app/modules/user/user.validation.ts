import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, 'Name is too short').optional(),
    category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HEALTHCARE', 'EDUCATION']).optional(),
    areaId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;



const atLeastOne = { message: 'Provide at least one profile field' };

export const customerProfileSchema = z
  .object({
    nid: z.string().min(10, 'NID looks too short').max(20).optional(),
    serviceAddress: z.string().min(5).max(200).optional(),
    thana: z.string().max(60).optional(),
    city: z.string().max(60).optional(),
    postalCode: z.string().max(10).optional(),
    landline: z.string().max(20).optional(),
    emergencyContact: z.string().max(20).optional(),
    preferredLanguage: z.enum(['en', 'bn']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, atLeastOne);

export const technicianProfileSchema = z
  .object({
    employeeId: z.string().min(2).max(20).optional(),
    specialization: z.enum(['LINE', 'TRANSFORMER', 'METERING', 'GENERATION']).optional(),
    experienceYears: z.coerce.number().int().min(0).max(45).optional(),
    certification: z.string().max(120).optional(),
    phone: z.string().max(20).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, atLeastOne);

export const operatorProfileSchema = z
  .object({
    employeeId: z.string().min(2).max(20).optional(),
    designation: z.string().max(80).optional(),
    shift: z.enum(['MORNING', 'EVENING', 'NIGHT']).optional(),
    phone: z.string().max(20).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, atLeastOne);

export const adminProfileSchema = z
  .object({
    employeeId: z.string().min(2).max(20).optional(),
    designation: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, atLeastOne);

export const adminUpdateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'FIELD_TECHNICIAN', 'POWER_OPERATOR', 'ADMIN']),
});

export const adminUpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED']),
});