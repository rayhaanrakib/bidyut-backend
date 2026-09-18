import { z } from "zod";

export const zoneSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  code: z.string().optional(),
});
export const substationSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  zoneId: z.string().uuid("zoneId must be a valid id"),
});
export const feederSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  substationId: z.string().uuid("substationId must be a valid id"),
  capacityMW: z.coerce.number().int().positive().optional(),
});
export const areaSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  feederId: z.string().uuid("feederId must be a valid id"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const zoneUpdateSchema = zoneSchema.partial();
export const substationUpdateSchema = substationSchema.partial();
export const feederUpdateSchema = feederSchema.partial();
export const areaUpdateSchema = areaSchema.partial();
