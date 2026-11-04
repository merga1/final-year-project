'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function HeaderProfileMenu({
  userName,
  userEmail,
  initial,
}: {
  userName: string;
  userEmail: string;
  initial: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
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
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        title={`Administrator Profile (${userName})`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '50%',
        }}
      >
        <div
          className="header-avatar-circle"
          style={{
            transform: open ? 'scale(1.08)' : 'scale(1)',
            boxShadow: open ? '0 0 0 3px rgba(30, 107, 82, 0.4)' : undefined,
          }}
        >
          {initial}
        </div>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 260,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16), 0 4px 8px rgba(15, 23, 42, 0.06)',
            border: '1px solid #e2e8f0',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'fadeInMenu 0.15s ease-out',
          }}
        >
          {/* User Profile Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#e6f7f2',
                  color: '#1e6b52',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userName}
                  </span>
                  <span className="role-badge" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                    Admin
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {userEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Links */}
          <div style={{ padding: '6px' }}>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                color: '#0f172a',
                fontSize: '0.86rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e6b52" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Administrator Profile</span>
            </Link>

            <Link
              href="/audit"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                color: '#0f172a',
                fontSize: '0.86rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Audit Trail</span>
            </Link>
          </div>

          {/* Footer Sign Out */}
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: '0.86rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
