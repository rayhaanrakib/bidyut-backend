import type { User as PrismaUser } from "@/generated/prisma/client";

declare global {
  namespace Express {
    interface User extends PrismaUser {}
    interface Request {
      googleIdToken?: string;
    }
  }
}

export {};
