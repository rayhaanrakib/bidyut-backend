import app from "./app";
import config from "./app/config";
import { initializeServices } from "./app/lib/initServices";
import { prisma } from "./app/lib/prisma";

const PORT = config.server.port;

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
const isRender = process.env.RENDER === "true" || process.env.RENDER_EXTERNAL_URL !== undefined;
const isDirectEntry = import.meta.main || isRender;

if (!isVercel && isDirectEntry) {
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
