import { z } from "zod";

const runtimeEnv = globalThis.__WITCH_WOOFIE_ENV__ ?? process.env;

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().max(90).default(30),
  FRONTEND_ORIGINS: z.string().default("http://localhost:3000"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_SECURE: z.string().default("false"),
  INVITATION_TTL_HOURS: z.coerce.number().int().positive().max(168).default(48),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12)
});

const parsed = schema.safeParse(runtimeEnv);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. Check Worker variables and secrets.");
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  cookieSecure: parsed.data.COOKIE_SECURE === "true",
  frontendOrigins: parsed.data.FRONTEND_ORIGINS.split(",").map(v => v.trim()).filter(Boolean)
};
