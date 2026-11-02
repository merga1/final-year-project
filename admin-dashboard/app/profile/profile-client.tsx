'use client';

import { useState, type FormEvent } from 'react';

export default function ProfileClient({ email, token }: { email: string; token?: string }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
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
        setError(data.message || 'Failed to change password');
        return;
      }

      setMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch {
      setError('Could not connect to the server');
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
      <div className="profile-card-container">
        <h2 className="profile-card-title">Administrator Account</h2>

        <div className="profile-email-block">
          <span className="profile-email-label">Logged in as</span>
          <span className="profile-email-value">{email}</span>
        </div>

        <div className="profile-email-block">
          <span className="profile-email-label">Access Level</span>
          <span style={{ display: 'inline-block', marginTop: 4 }}>
            <span className="role-badge" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
              Full Administrator
            </span>
          </span>
        </div>

        {message && <div className="form-success-alert">{message}</div>}
        {error && <div className="form-error-alert">{error}</div>}

        <form onSubmit={handleChangePassword} className="profile-form">
          <div className="form-field-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              type="password"
              className="profile-input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="profile-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-change-password"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      <footer className="dashboard-global-footer">
        <span className="footer-copyright">
          Smart Water Management System &middot; Admin Operations Console
        </span>
        <div className="footer-social-links">
          <span className="social-icon">SWMS v1.0</span>
        </div>
      </footer>
    </div>
  );
}
