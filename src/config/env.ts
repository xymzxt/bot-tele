import 'dotenv/config';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().int().optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BOT_TOKEN: z.string().min(8, 'BOT_TOKEN is required'),
  TELEGRAM_SECRET_TOKEN: optionalString,
  PUBLIC_APP_URL: optionalUrl,

  OWNER_TELEGRAM_ID: optionalNumber,
  ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY must be at least 16 characters'),

  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_STORAGE_BUCKET: z.string().default('telegram-dev-assistant'),

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,

  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GITHUB_OAUTH_REDIRECT_URL: optionalUrl,

  AI_API_BASE_URL: optionalUrl,
  AI_API_KEY: optionalString,
  AI_MODEL: z.string().default('gpt-4o-mini'),

  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  STATUS_CACHE_TTL_MS: z.coerce.number().int().positive().default(15_000),
  BOT_VERSION: z.string().default('0.1.0'),
  APP_REGION: z.string().default(process.env.VERCEL_REGION ?? 'local'),
  VERCEL_REGION: optionalString,
});

export const env = EnvSchema.parse(process.env);

export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
export const isGithubOAuthConfigured = Boolean(
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_OAUTH_REDIRECT_URL,
);
export const isAiConfigured = Boolean(env.AI_API_BASE_URL && env.AI_API_KEY);
