import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import config from "@app/config";

const app: Application = express();

// CORS — allow requests from the configured frontend URL
app.use(
  cors({
    origin: config.server.frontendUrl,
    credentials: true,
  }),
);
// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// cookie parser
app.use(cookieParser());

// health check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Healthy" });
});

// home
app.get("/", (req: Request, res: Response) => {
  // more visual response
  res.json({
    status: "success",
    message: "Welcome to Bidyut Backend!",
    live_server: "Not Ready Yet",
    api_documentation: "Not Ready Yet",
    version: "1.0.0",
    database: "PostgreSQL",
    framework: "Express.js",
    language: "TypeScript",
    hosting: "Vercel",
    timestamp: new Date().toISOString(),
    browser: req.get("User-Agent"),
    developer: "rayhaanrakib",
    developer_portfolio: "https://rayhaanrakib.vercel.app",
  });
  res.status(200);
});

export default app;
