import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";

import config from "./app/config";
import passport from "./app/lib/passport";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import analyticsRoutes from "./app/modules/analytics/analytics.route";
import authRoutes from "./app/modules/auth/auth.route";
import gridRoutes from "./app/modules/grid/grid.route";
import internalRoutes from "./app/modules/internal/internal.route";
import outageRoutes from "./app/modules/outage/outage.route";
import paymentRoutes from "./app/modules/payment/payment.route";
import publicRoutes from "./app/modules/public/public.route";
import scheduleRoutes from "./app/modules/schedule/schedule.route";
import userRoutes from "./app/modules/user/user.route";
import { sendResponse } from "./app/utils/sendResponse";

const app: Application = express();

// Security & Parser Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [config.server.frontendUrl],
    credentials: true,
  }),
);
app.use(cookieParser());

// Stripe Webhook (Raw body parser must be mounted before express.json)
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

// Standard body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// Backend home / API information
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Bidyut Backend! ⚡",

    project: {
      name: "Bidyut",
      description: "A smart electricity management and monitoring platform.",
      type: "REST API",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    },

    server: {
      status: "online",
      framework: "Express.js",
      runtime: "Node.js",
      language: "TypeScript",
      database: "PostgreSQL",
      orm: "Prisma",
      hosting: "Vercel",
    },

    api: {
      version: "v1",
      documentation: "Not Ready Yet",
      health_check: "/health",
    },

    developer: {
      username: "rayhaanrakib",
      portfolio: "https://rayhaanrakib.vercel.app",
    },

    request: {
      method: req.method,
      path: req.originalUrl,
      browser: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    },
  });
});

// Health Check
app.get("/health", (_req, res) => {
  sendResponse(res, 200, "BIDYUT API is running");
});

// Module Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/grid", gridRoutes);
app.use("/api/v1/outages", outageRoutes);
app.use("/api/v1/schedules", scheduleRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/internal", internalRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(globalErrorHandler);

export default app;
