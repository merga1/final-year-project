import { cookies } from 'next/headers';

export const TOKEN_COOKIE = 'sw_token';
export const USER_COOKIE = 'sw_user';

/** Read JWT from server-side cookie store (Server Components only) */
export async function getServerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value ?? null;
}

/** Read parsed user from server-side cookie store (Server Components only) */
export async function getServerUser(): Promise<{ name: string; email: string; role: string } | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)); } catch { return null; }
}
