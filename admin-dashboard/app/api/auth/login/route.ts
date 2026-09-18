import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, USER_COOKIE } from '../../../../lib/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message ?? 'Invalid credentials' },
        { status: res.status },
      );
    }

    const { accessToken, user } = await res.json();

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'This dashboard is for administrators only.' },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();

    // Set secure HttpOnly cookie for token
    cookieStore.set({
      name: TOKEN_COOKIE,
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    // Set user info cookie for UI
    cookieStore.set({
      name: USER_COOKIE,
      value: encodeURIComponent(JSON.stringify(user)),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Authentication server unreachable' },
      { status: 500 },
    );
  }
}
