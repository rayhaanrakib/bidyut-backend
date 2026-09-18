import bcrypt from "bcrypt";
import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import { googleClient } from "../../lib/google";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import {
  createAccessToken,
  createRefreshToken,
  type JwtPayload,
  verifyRefreshToken,
} from "../../utils/jwt";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Redis helper that fails politely if Redis is down (edge case: never crash the app)
async function otpSave(key: string, value: string) {
  try {
    await redis.set(key, value, { EX: 600 }); // expires in 10 minutes
  } catch {
    throw new AppError(503, "OTP service is temporarily unavailable. Please try again.");
  }
}

export function issueTokens(user: User) {
  const payload = { id: user.id, role: user.role };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
}

export function safeUser(user: User) {
  const copy: any = { ...user };
  delete copy.passwordHash; // never leak password hashes in responses
  return copy;
}

// ---------- registration with email OTP ----------
export async function register(input: {
  name: string;
  email: string;
  password: string;
  category?: string;
  areaId?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists");

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

  // the account is NOT created yet — it lives in Redis until the OTP is verified
  await otpSave(`pending:${input.email}`, JSON.stringify({ ...input, passwordHash }));
  await otpSave(`otp:${input.email}`, otp);

  await sendEmail(input.email, "Your BIDYUT verification code", "otp", { name: input.name, otp });
  return { email: input.email, message: "OTP sent to your email. It expires in 10 minutes." };
}

export async function verifyOtp(input: { email: string; otp: string }) {
  const savedOtp = await redis.get(`otp:${input.email}`);
  if (!savedOtp || savedOtp !== input.otp) throw new AppError(400, "Invalid or expired OTP");

  const pendingRaw = await redis.get(`pending:${input.email}`);
  if (!pendingRaw) throw new AppError(400, "Registration session expired. Please register again.");

  const pending = JSON.parse(pendingRaw);
  const user = await prisma.user.create({
    data: {
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      category: pending.category ?? "RESIDENTIAL",
      areaId: pending.areaId ?? null,
      role: "CUSTOMER",
      emailVerified: true, // the OTP just proved this email
    },
  });
  await redis.del([`otp:${input.email}`, `pending:${input.email}`]); // node-redis takes an array

  // 🎉 welcome email — fire-and-forget: signup NEVER fails because an email did
  sendEmail(user.email, "Welcome to BIDYUT ⚡ Your account is ready", "welcome", {
    name: user.name,
    frontendUrl: config.server.frontendUrl,
  }).catch(() => null);

  return { user: safeUser(user), ...issueTokens(user) };
}

// ---------- refresh / logout support ----------
export async function refreshTokens(refreshToken?: string) {
  if (!refreshToken) throw new AppError(401, "Refresh token is missing");

  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.isDeleted || user.status === "BLOCKED")
    throw new AppError(401, "Session is no longer valid");
  return issueTokens(user);
}

// ---------- forgot / reset password ----------
export async function forgotPassword(input: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.isDeleted) throw new AppError(404, "No account found with this email");

  const otp = generateOtp();
  await otpSave(`reset:${input.email}`, otp);
  await sendEmail(input.email, "Reset your BIDYUT password", "reset-otp", { name: user.name, otp });
  return { message: "Password reset OTP sent to your email" };
}

export async function resetPassword(input: { email: string; otp: string; newPassword: string }) {
  const savedOtp = await redis.get(`reset:${input.email}`);
  if (!savedOtp || savedOtp !== input.otp) throw new AppError(400, "Invalid or expired OTP");

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError(404, "No account found with this email");

  const passwordHash = await bcrypt.hash(input.newPassword, config.bcryptSaltRounds);
  await prisma.user.update({ where: { email: input.email }, data: { passwordHash } });
  await redis.del(`reset:${input.email}`);

  // 🔐 security confirmation — the user should hear about EVERY password change from us
  sendEmail(input.email, "Your BIDYUT password was changed", "password-changed", {
    name: user.name,
    frontendUrl: config.server.frontendUrl,
  }).catch(() => null);

  return { message: "Password updated successfully. Please log in again." };
}

// ---------- google id-token login + signup (Postman) ----------
export async function googleIdTokenLogin(input: { idToken: string }) {
  let payload: { email?: string; sub?: string; name?: string } | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: config.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, "Invalid or expired Google ID token");
  }
  if (!payload?.email || !payload.sub) throw new AppError(400, "Google account has no email");

  // 1 — already linked? straight login
  let user = await prisma.user.findFirst({ where: { googleId: payload.sub, isDeleted: false } });

  // 2 — same email registered via OTP? link it (one user, one account)
  if (!user) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      if (existing.isDeleted || existing.status === "BLOCKED")
        throw new AppError(403, "This account is not allowed to log in");
      if (!existing.googleId) {
        await prisma.user.update({ where: { id: existing.id }, data: { googleId: payload.sub } });
      }
      user = existing;
    }
  }

  // 3 — brand-new Google email? create the account (Google is the credential) + 🎉 welcome
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        name: payload.name || "Google User",
        email: payload.email,
        passwordHash: null,
        googleId: payload.sub,
        authProvider: "GOOGLE",
        emailVerified: true, // Google already verified this email
        passwordRequired: false, // passwordless — they can add one via forgot-password later
        role: "CUSTOMER",
      },
    });
    sendEmail(payload.email, "Welcome to BIDYUT ⚡ Your account is ready", "welcome", {
      name: user.name,
      frontendUrl: config.server.frontendUrl,
    }).catch(() => null);
  }

  if (user.status === "BLOCKED") throw new AppError(403, "Your account has been blocked");
  return { user: safeUser(user), ...issueTokens(user), isNewUser };
}
