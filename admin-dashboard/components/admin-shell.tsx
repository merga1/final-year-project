import Link from 'next/link';
import type { ReactNode } from 'react';

import { navItems } from './navigation';

type AdminShellProps = {
  title: string;
  description: string;
  currentPath: string;
  children: ReactNode;
  status?: string;
};

export function AdminShell({
  title,
  description,
  currentPath,
  children,
  status,
}: AdminShellProps) {
  return (
    <main className="page">
      <aside className="sidebar">
        <h1>Smart Water Admin</h1>
        <nav>
          {navItems.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'nav-link active' : 'nav-link'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
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
