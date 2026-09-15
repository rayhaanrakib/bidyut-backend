import app from "./app";
import config from "@app/config";
import { prisma } from "@lib/prisma";
import { redis } from "@lib/redis";
import { seed } from "@utils/seed";
import { transporter } from "@lib/nodemailer";

const PORT = config.server.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to the database successfully.");

    try {
      await redis.connect();
      console.log("✅ Redis connected successfully.");
    } catch {
      console.warn(
        "⚠️ Redis unavailable — OTP/cache features degrade (server continues).",
      );
    }
    await seed();
    
    if (config.smtp.user && config.smtp.pass) {
      try {
        await transporter.verify();
        console.log("✅ Nodemailer connected successfully.");
      } catch {
        console.warn(
          "⚠️ SMTP unavailable — emails will be skipped (server continues).",
        );
      }
    }

    app.listen(PORT, () => {
      console.log(
        `⚡ BIDYUT server is running on port ${PORT} (${config.server.nodeEnv})`,
      );
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    console.log("Disconnected from the database.");
    process.exit(1);
  }
};

main();
