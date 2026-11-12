import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { newTokenId, sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(60)
});

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128)
});

async function issueSession(user, res) {
  const tokenId = newTokenId();
  const refreshToken = signRefreshToken(user._id, tokenId);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400000);
  await RefreshSession.create({ userId: user._id, tokenId, expiresAt });
  setAuthCookies(res, signAccessToken(user._id), refreshToken);
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid registration details", errors: parsed.error.flatten() });

  const email = parsed.data.email.toLowerCase().trim();
  if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(parsed.data.password, env.BCRYPT_ROUNDS);
  const user = await User.create({ email, passwordHash, displayName: parsed.data.displayName });
  await issueSession(user, res);

  res.status(201).json({ user: { id: user._id, email: user.email, displayName: user.displayName, coupleId: user.coupleId } });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid login details" });

  const user = await User.findOne({ email: parsed.data.email.toLowerCase().trim() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  await issueSession(user, res);
  res.json({ user: { id: user._id, email: user.email, displayName: user.displayName, coupleId: user.coupleId } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.ww_refresh;
  if (!token) return res.status(401).json({ message: "Refresh token required" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }

  if (payload.typ !== "refresh" || !payload.jti) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const session = await RefreshSession.findOneAndDelete({ tokenId: payload.jti, userId: payload.sub });
  if (!session || session.expiresAt <= new Date()) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Refresh session expired or already used" });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Account not found" });
  }

  await issueSession(user, res);
  res.json({ user: { id: user._id, email: user.email, displayName: user.displayName, coupleId: user.coupleId } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.ww_refresh;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      if (payload.jti) await RefreshSession.deleteOne({ tokenId: payload.jti, userId: payload.sub });
    } catch {
      // Expired/invalid refresh tokens are still cleared from the browser.
    }
  }
  clearAuthCookies(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, displayName: req.user.displayName, coupleId: req.user.coupleId } });
});
