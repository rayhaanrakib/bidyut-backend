import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";
import { tryCatchAsync } from "../utils/tryCatchAsync";

const validateRequest = (schema: ZodType) =>
  tryCatchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      if (!first) throw new AppError(400, "Validation failed");
      const field = first.path.join(".");
      throw new AppError(
        400,
        `Validation failed${field ? ` for "${field}"` : ""}: ${first.message}`,
      );
    }
    req.body = result.data; // parsed + coerced values (e.g. numbers) replace the raw body
    next();
  });

export default validateRequest;
