import app from "./app";
import config from "@app/config";
import { prisma } from "@lib/prisma";
import { redis } from "@lib/redis";
import { seed } from "@utils/seed";

const PORT = config.server.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to the database successfully.");

    try {
      await redis.connect(); // node-redis does not auto-connect — boot owns the connection
      console.log("✅ Redis connected successfully.");
    } catch {
      console.warn(
        "⚠️ Redis unavailable — OTP/cache features degrade (server continues).",
      );
    }

    await seed(); // creates demo accounts + grid data if missing

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
