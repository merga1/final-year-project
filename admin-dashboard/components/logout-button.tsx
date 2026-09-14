'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  function logout() {
    document.cookie = 'sw_token=; path=/; max-age=0';
    document.cookie = 'sw_user=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={logout} className="logout-btn">
      ← Sign out
    </button>
  );
}
