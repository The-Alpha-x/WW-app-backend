import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString(), typ: "access" }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: "witch-woofie-api",
    audience: "witch-woofie-web"
  });
}

export function signRefreshToken(userId, tokenId) {
  return jwt.sign({ sub: userId.toString(), jti: tokenId, typ: "refresh" }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_DAYS}d`,
    issuer: "witch-woofie-api",
    audience: "witch-woofie-web"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer: "witch-woofie-api",
    audience: "witch-woofie-web"
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET, {
    issuer: "witch-woofie-api",
    audience: "witch-woofie-web"
  });
}

export const newTokenId = () => crypto.randomUUID();
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const randomCode = () => crypto.randomBytes(24).toString("base64url");
