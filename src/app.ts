import config from "@app/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import notFound from "@middleware/notFound";
import globalErrorHandler from "@middleware/globalErrorHandler";
import router from "./app/routes";

const app: Application = express();

// CORS — allow requests from the configured frontend URL
app.use(
  cors({
    origin: config.server.frontendUrl,
    credentials: true,
  }),
);
// security
app.use(helmet());
app.use(cors({ origin: [config.server.frontendUrl], credentials: true }));
app.use(cookieParser());

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Health Status
app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Bidyut Backend is running" });
});

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
// Version Status
app.get("/api/v1", (req: Request, res: Response) =>
  res.json({
    success: true,
    message: "Backend API v1 is running successfully.",
  }),
);

// routes
app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
