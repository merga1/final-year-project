import type { ReactNode } from 'react';
import { getServerUser } from '../lib/auth';
import { AdminShellClient } from './admin-shell-client';

type AdminShellProps = {
  title?: string;
  description?: string;
  status?: string;
  currentPath: string;
  children: ReactNode;
};

export async function AdminShell({
  title,
  currentPath,
  children,
}: AdminShellProps) {
  const user = await getServerUser();
  const userName = user?.name || 'Admin';
  const userEmail = user?.email || '';
  const initial = (userName.charAt(0) || 'A').toUpperCase();

  return (
    <AdminShellClient
      title={title}
      currentPath={currentPath}
      userName={userName}
      userEmail={userEmail}
      initial={initial}
    >
      {children}
    </AdminShellClient>
  );
}
