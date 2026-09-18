import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  server: {
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT) || 5000,
    backendUrl: process.env.BACKEND_URL!,
    frontendUrl: process.env.FRONTEND_URL!,
    databaseUrl: process.env.DATABASE_URL!,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS)!,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: `${process.env.BACKEND_URL!}/api/v1/auth/google/callback`,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    currency: process.env.STRIPE_CURRENCY!,
    priorityPrice: Number(process.env.PRIORITY_RESTORATION_PRICE)!,
    slaPrice: Number(process.env.SLA_SUBSCRIPTION_PRICE)!,
  },
  slaDays: Number(process.env.SLA_SUBSCRIPTION_DAYS)!,

  redis: {
    user: process.env.REDIS_USER!,
    password: process.env.REDIS_PASSWORD!,
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT)!,
  },

  smtp: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
    sender: process.env.EMAIL_SENDER || process.env.SMTP_USER!,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },

  bulk: {
    threshold: Number(process.env.BULK_OUTAGE_THRESHOLD)!,
    windowMinutes: Number(process.env.BULK_OUTAGE_WINDOW_MINUTES)!,
  },
  weeklyCapMinutes: Number(process.env.FEEDER_WEEKLY_LOAD_SHED_CAP_MINUTES) || 600,
  slaBreachHours: Number(process.env.SLA_BREACH_HOURS)!,
  cronSecret: process.env.CRON_SECRET!,

  seed: {
    admin: {
      name: process.env.SEED_ADMIN_NAME!,
      email: process.env.SEED_ADMIN_EMAIL!,
      password: process.env.SEED_ADMIN_PASSWORD!,
    },
    operator: {
      name: process.env.SEED_OPERATOR_NAME!,
      email: process.env.SEED_OPERATOR_EMAIL!,
      password: process.env.SEED_OPERATOR_PASSWORD!,
    },
    technician: {
      name: process.env.SEED_TECHNICIAN_NAME!,
      email: process.env.SEED_TECHNICIAN_EMAIL!,
      password: process.env.SEED_TECHNICIAN_PASSWORD!,
    },
    customer: {
      name: process.env.SEED_CUSTOMER_NAME!,
      email: process.env.SEED_CUSTOMER_EMAIL!,
      password: process.env.SEED_CUSTOMER_PASSWORD!,
    },
  },
};
