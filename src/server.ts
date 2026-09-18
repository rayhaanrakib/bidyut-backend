import type { NextFunction, Request, Response } from "express";
import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redis } from "./app/lib/redis";
import { seed } from "./app/utils/seed";

const PORT = config.server.port;

let initializationPromise: Promise<void> | null = null;

const initializeServices = async (): Promise<void> => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL database successfully.");

    try {
      await redis.connect();
      console.log("✅ Redis connected successfully.");
    } catch {
      console.warn("⚠️ Redis unavailable — OTP/cache features degrade (server continues).");
    }

    await seed();

    if (config.smtp.user && config.smtp.pass) {
      try {
        await transporter.verify();
        console.log("✅ Nodemailer connected successfully.");
      } catch {
        console.warn("⚠️ SMTP unavailable — emails will be skipped (server continues).");
      }
    }
  })();

  return initializationPromise;
};

// Middleware to ensure services are ready before processing serverless requests
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await initializeServices();
    next();
  } catch (error) {
    next(error);
  }
});

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

if (!isVercel && process.argv[1] && process.argv[1].includes("server")) {
  (async () => {
    try {
      await initializeServices();
      app.listen(PORT, () => {
        console.log(`⚡ BIDYUT server is running on port ${PORT} (${config.server.nodeEnv})`);
      });
    } catch (error) {
      console.error("Error starting the server:", error);
      await prisma.$disconnect();
      console.log("Disconnected from PostgreSQL database.");
      process.exit(1);
    }
  })();
}

export default app;
