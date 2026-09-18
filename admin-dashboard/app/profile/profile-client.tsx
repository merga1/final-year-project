'use client';

import { useState, type FormEvent } from 'react';

export default function ProfileClient({ email }: { email: string }) {
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
      const res = await fetch('http://localhost:4000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('sw_token')}`,
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
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  }

  return (
    <div className="section-container profile-section-view">
      <div className="profile-card-container">
        <h2 className="profile-card-title">Account Details</h2>

        <div className="profile-email-block">
          <span className="profile-email-label">Email Address</span>
          <span className="profile-email-value">{email}</span>
        </div>

        {message && <div className="form-success-alert">{message}</div>}
        {error && <div className="form-error-alert">{error}</div>}

        <form onSubmit={handleChangePassword} className="profile-form">
          <div className="profile-input-stack">
            <input
              type="password"
              placeholder="Old Password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="profile-input"
            />
            <input
              type="password"
              placeholder="New Password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="profile-input"
            />
          </div>

          <button
            type="submit"
            className="btn-change-password"
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>

      <footer className="dashboard-global-footer">
        <span className="footer-copyright">
          Powered by AquaSense Smart Water Management
        </span>
        <div className="footer-social-links">
          <span className="social-icon" aria-label="Twitter">𝕏</span>
          <span className="social-icon" aria-label="Facebook">ⓕ</span>
          <span className="social-icon" aria-label="TikTok">♪</span>
          <span className="social-icon" aria-label="LinkedIn">in</span>
        </div>
      </footer>
    </div>
  );
}
