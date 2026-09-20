import config from "../config";
import { seed } from "../utils/seed";
import { transporter } from "./nodemailer";
import { prisma } from "./prisma";
import { redis } from "./redis";

let initializationPromise: Promise<void> | null = null;

export const initializeServices = async (): Promise<void> => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL database successfully.");

    try {
      await redis.ping();
      console.log("✅ Redis connected successfully.");
    } catch (err) {
      console.warn("⚠️ Redis unavailable — OTP/cache features degrade (server continues).", err);
    }

    await seed();

    if (config.smtp.user && config.smtp.pass) {
      try {
        await transporter.verify();
        console.log("✅ Nodemailer connected successfully.");
      } catch (err) {
        console.warn("⚠️ SMTP unavailable — emails will be skipped (server continues).", err);
      }
    }
  })().catch((err) => {
    initializationPromise = null; // retry on next request instead of caching the failure
    throw err;
  });

  return initializationPromise;
};
