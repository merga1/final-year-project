import Link from 'next/link';
import type { ReactNode } from 'react';
import { navItems } from './navigation';
import { LogoutButton } from './logout-button';
import { getServerUser } from '../lib/auth';

type AdminShellProps = {
  title?: string;
  description?: string;
  status?: string;
  currentPath: string;
  children: ReactNode;
};

function renderNavIcon(iconName: string) {
  switch (iconName) {
    case 'home':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

export async function AdminShell({
  title,
  currentPath,
  children,
}: AdminShellProps) {
  const user = await getServerUser();
  const userName = user?.name || 'Yo 2';
  const userEmail = user?.email || 'admin2@gmail.com';
  const initial = (userName.charAt(0) || 'Y').toUpperCase();

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className="sidebar-container">
        <div className="sidebar-brand">
          <div className="brand-logo-wrap" style={{ background: 'transparent' }}>
            <svg width="34" height="34" viewBox="0 0 140 160">
              <path d="M 65,10 C 65,10 115,75 115,105 A 50,50 0 1,1 15,105 C 15,75 65,10 65,10 Z" fill="#1e6b52" />
              <circle cx="102" cy="40" r="9" fill="#cc7a42" />
              <path d="M 22,105 L 48,105 L 60,78 L 74,128 L 86,105 L 108,105" fill="none" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title" style={{ color: '#1e6b52', fontWeight: 800 }}>AquaSense</span>
            <span className="brand-org">Smart Water Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-wrap">{renderNavIcon(item.iconName)}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar-circle">{initial}</div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-viewport">
        {/* Top Header */}
        <header className="top-nav-bar">
          <div className="top-nav-left">
            <button className="icon-btn-hamburger" aria-label="Menu" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="dashboard-title">MY DASHBOARD</h1>
          </div>

          <div className="top-nav-right">
            <button className="theme-toggle-btn" aria-label="Toggle theme" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
            <div className="header-avatar-circle">{initial}</div>
          </div>
        </header>

        {/* Page Body */}
        <main className="page-content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}
