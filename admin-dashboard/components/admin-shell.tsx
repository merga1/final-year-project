import Link from 'next/link';
import type { ReactNode } from 'react';
import { navItems } from './navigation';
import { LogoutButton } from './logout-button';
import { getServerUser } from '../lib/auth';

type AdminShellProps = {
  title: string;
  description: string;
  currentPath: string;
  children: ReactNode;
  status?: string;
};

export async function AdminShell({
  title, description, currentPath, children, status,
}: AdminShellProps) {
  const user = await getServerUser();

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>💧 Smart Water</h1>
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="badge ok" style={{ fontSize: '0.7rem' }}>Admin</span>
            </div>
          )}
        </div>
        <nav>
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={isActive ? 'nav-link active' : 'nav-link'}>
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </aside>

      <section className="main">
        <div className="hero">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {status ? <span className="badge ok">{status}</span> : null}
        </div>
        {children}
      </section>
    </main>
  );
}
