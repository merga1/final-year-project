'use client';

import { useState, type FormEvent } from 'react';

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

      setMessage('Password changed successfully! Use your new password on subsequent logins.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Could not connect to the backend server. Please verify network connectivity.');
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
    <div className="section-container">
      {/* Header Row */}
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Administrator Profile</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Account identity, platform privileges, and master security credentials
          </span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="stats-strip">
        <div className="stat-chip stat-chip-teal">
          <span className="stat-chip-val" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <span className="stat-chip-label">Super Administrator</span>
        </div>
        <div className="stat-chip stat-chip-green">
          <span className="stat-chip-val">Active</span>
          <span className="stat-chip-label">Console Session</span>
        </div>
        <div className="stat-chip stat-chip-amber">
          <span className="stat-chip-val">Tier 1</span>
          <span className="stat-chip-label">Root Privileges</span>
        </div>
        <div className="stat-chip stat-chip-purple">
          <span className="stat-chip-val">JWT 256</span>
          <span className="stat-chip-label">Signed Token</span>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Account Specifications */}
        <div className="table-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e6b52 0%, #2a8a6b 100%)',
                color: '#ffffff',
                fontSize: '1.3rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(30, 107, 82, 0.25)',
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {userName}
                </h3>
                <span className="status-badge status-ok" style={{ fontSize: '0.72rem' }}>
                  Active
                </span>
              </div>
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>{userEmail}</span>
            </div>
          </div>

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
                Telemetry, Remote Valves, Billing & Invoicing, IoT Calibration, Technicians, Support Escalations, Audit Trail
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
                  style={{ width: '100%', paddingRight: 50 }}
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
                    fontWeight: 500,
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
                  style={{ width: '100%', paddingRight: 50 }}
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
                    fontWeight: 500,
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
                  style={{ width: '100%', paddingRight: 50 }}
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
                    fontWeight: 500,
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
                backgroundColor: '#1e6b52',
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
    </div>
  );
}
