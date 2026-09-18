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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Invalid credentials');
        return;
      }

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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="64" height="74" viewBox="0 0 140 160">
            <path d="M 65,10 C 65,10 115,75 115,105 A 50,50 0 1,1 15,105 C 15,75 65,10 65,10 Z" fill="#1e6b52" />
            <circle cx="102" cy="40" r="9" fill="#cc7a42" />
            <path d="M 22,105 L 48,105 L 60,78 L 74,128 L 86,105 L 108,105" fill="none" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ color: '#1e6b52', fontWeight: 800, letterSpacing: '-0.5px' }}>AquaSense</h1>
        <p className="login-org-subtitle" style={{ color: '#64748b', fontWeight: 600, letterSpacing: '1px' }}>SMART WATER MONITORING</p>
        <p className="login-subtitle">Sign in to your administrative dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin2@gmail.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="login-hint">
          Demo Admin: <code>admin2@gmail.com</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  );
}
