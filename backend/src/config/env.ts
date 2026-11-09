/** Central place for reading environment variables safely. */

const clean = (value?: string) => value?.replace(/^\uFEFF/, '').trim() || undefined;

export const isProduction = () => process.env.NODE_ENV === 'production';

/** PostgreSQL connection string, or undefined when SQLite should be used. */
export function getDatabaseUrl(): string | undefined {
  return clean(process.env.DATABASE_URL) ?? clean(process.env.POSTGRES_URL);
}

/**
 * JWT signing secret. A missing secret is a hard error in production; in
 * development a clearly-named fallback is used so the API still starts.
 */
export function getJwtSecret(): string {
  const secret = clean(process.env.JWT_SECRET);
  if (secret) return secret;
  if (isProduction()) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }
  return 'dev-only-insecure-secret';
}

export const JWT_EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS) || 7 * 24 * 60 * 60;

/** Allowed browser origins. Unset = allow all (development only). */
export function getCorsOrigins(): string[] | true {
  const list = clean(process.env.CORS_ORIGINS);
  return list ? list.split(',').map((o) => o.trim()).filter(Boolean) : true;
}

/** Shared secret that IoT meters send in the `x-device-key` header. */
export const getDeviceApiKey = () => clean(process.env.DEVICE_API_KEY);
