'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Invalid credentials');
        return;
      }

      const { accessToken, user } = await res.json();

      if (user.role !== 'admin') {
        setError('This dashboard is for administrators only.');
        return;
      }

      // Store token in cookie (accessible server-side by Next.js RSC)
      document.cookie = `sw_token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      document.cookie = `sw_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">💧</div>
        <h1>Smart Water Admin</h1>
        <p className="login-subtitle">Sign in to the operations dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="username"
            placeholder="admin@admin.water" />

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password"
            placeholder="••••••••" />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="login-hint">
          Demo: <code>admin@admin.water</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
