'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback
    }
    document.cookie = 'sw_token=; path=/; max-age=0';
    document.cookie = 'sw_user=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={logout} className="logout-btn" type="button">
      ← Sign out
    </button>
  );
}
