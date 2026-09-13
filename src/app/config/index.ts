import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  server: {
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT) || 5000,
    backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL || "",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v1/auth/google/callback`,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: process.env.STRIPE_CURRENCY || "bdt",
    priorityPrice: Number(process.env.PRIORITY_RESTORATION_PRICE) || 99,
    slaPrice: Number(process.env.SLA_SUBSCRIPTION_PRICE) || 499,
  },
  slaDays: Number(process.env.SLA_SUBSCRIPTION_DAYS) || 30,

  redis: {
    user: process.env.REDIS_USER || "default",
    password: process.env.REDIS_PASSWORD || "",
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },

  smtp: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
    sender: process.env.EMAIL_SENDER || process.env.SMTP_USER || "",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  bulk: {
    threshold: Number(process.env.BULK_OUTAGE_THRESHOLD) || 5,
    windowMinutes: Number(process.env.BULK_OUTAGE_WINDOW_MINUTES) || 15,
  },
  weeklyCapMinutes:
    Number(process.env.FEEDER_WEEKLY_LOAD_SHED_CAP_MINUTES) || 600,
  slaBreachHours: Number(process.env.SLA_BREACH_HOURS) || 4,
  cronSecret: process.env.CRON_SECRET || "change_this_cron_secret",

  seed: {
    admin: {
      name: process.env.SEED_ADMIN_NAME || "Admin User",
      email: process.env.SEED_ADMIN_EMAIL || "admin@bidyut.demo",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    },
    operator: {
      name: process.env.SEED_OPERATOR_NAME || "Operator User",
      email: process.env.SEED_OPERATOR_EMAIL || "operator@bidyut.demo",
      password: process.env.SEED_OPERATOR_PASSWORD || "Operator@12345",
    },
    technician: {
      name: process.env.SEED_TECHNICIAN_NAME || "Technician User",
      email: process.env.SEED_TECHNICIAN_EMAIL || "technician@bidyut.demo",
      password: process.env.SEED_TECHNICIAN_PASSWORD || "Technician@12345",
    },
    customer: {
      name: process.env.SEED_CUSTOMER_NAME || "Demo Customer",
      email: process.env.SEED_CUSTOMER_EMAIL || "customer@bidyut.demo",
      password: process.env.SEED_CUSTOMER_PASSWORD || "Customer@12345",
    },
  },
};
