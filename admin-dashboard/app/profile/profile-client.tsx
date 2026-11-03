'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ProfileClient({
  user,
  token,
}: {
  user: any;
  token?: string;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const userName = user?.name || 'Yo 2';
  const userEmail = user?.email || 'admin2@gmail.com';
  const initial = (userName.charAt(0) || 'A').toUpperCase();

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000')
        .replace(String.fromCharCode(0xFEFF), '')
        .trim();

      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || getCookie('sw_token')}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Failed to change password. Please check your current password.');
        return;
      }

      setMessage('Password changed successfully! Next time you log in, use your new credentials.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Could not connect to the backend server. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  }

  function getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  }

  return (
    <div className="section-container profile-section-view">
      {/* Header Profile Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 12,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              fontSize: '1.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.15)',
            }}
          >
            {initial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                {userName}
              </h2>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.18)',
                  color: '#38bdf8',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                SUPER ADMINISTRATOR
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {userEmail}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/audit"
            className="btn-outline-gray"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.2)',
              fontSize: '0.82rem',
              padding: '8px 14px',
            }}
          >
            View Audit Log
          </Link>
          <Link
            href="/technicians"
            className="btn-outline-gray"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.2)',
              fontSize: '0.82rem',
              padding: '8px 14px',
            }}
          >
            Field Technicians
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Account Details & Privileges */}
        <div className="table-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Account Specifications
          </h3>

          <dl className="detail-fields" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field-row">
              <dt>Account Name</dt>
              <dd style={{ fontWeight: 600, color: '#0f172a' }}>{userName}</dd>
            </div>
            <div className="detail-field-row">
              <dt>Email Address</dt>
              <dd><code className="mono-text">{userEmail}</code></dd>
            </div>
            <div className="detail-field-row">
              <dt>Access Level</dt>
              <dd>
                <span className="status-badge status-ok" style={{ fontSize: '0.75rem' }}>
                  Full Administrator
                </span>
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>System Privileges</dt>
              <dd style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                Telemetry, Remote Valves, Billing & Invoicing, IoT Calibration, Technicians, Support Escalations
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Session State</dt>
              <dd>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  Active Secure Session
                </span>
              </dd>
            </div>
            <div className="detail-field-row">
              <dt>Authentication</dt>
              <dd className="text-muted-sm">JWT Bearer (Signed 256-bit Token)</dd>
            </div>
          </dl>
        </div>

        {/* Change Password Form */}
        <div className="table-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Security & Credentials
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#64748b' }}>
            Update administrator master password for console access.
          </p>

          {message && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              ✓ {message}
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-field-group">
              <label htmlFor="oldPassword" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="oldPassword"
                  type={showOld ? 'text' : 'password'}
                  className="profile-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  style={{ width: '100%', paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '0.8rem',
                  }}
                >
                  {showOld ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="newPassword" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                New Password (Min. 6 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  className="profile-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  style={{ width: '100%', paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '0.8rem',
                  }}
                >
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="confirmPassword" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="profile-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  style={{ width: '100%', paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '0.8rem',
                  }}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-change-password"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '10px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.88rem',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating Credentials...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      <footer className="dashboard-global-footer" style={{ marginTop: 32 }}>
        <span className="footer-copyright">
          Smart Water Management System &middot; Admin Operations Console
        </span>
        <div className="footer-social-links">
          <span className="social-icon">SWMS v1.0 &middot; Secure Mode</span>
        </div>
      </footer>
    </div>
  );
}
