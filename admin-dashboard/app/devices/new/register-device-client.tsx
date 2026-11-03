'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

export function RegisterDeviceClient({ token }: { token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (v) body[k] = v as string;
    }

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(String.fromCharCode(0xFEFF), '').trim();
      const t = token || getCookie('sw_token');
      const res = await fetch(`${API}/api/admin/devices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message || 'Failed to register device');
        setError(msg);
        return;
      }
      setSuccess('Device registered successfully!');
      setTimeout(() => router.push('/devices'), 1200);
    } catch {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-container">
      <Link href="/devices" className="back-link">Back to Devices</Link>
      <div className="form-card-container">
        <h2 className="form-card-title">Register New Device</h2>

        {error && <div className="form-error-alert">{error}</div>}
        {success && <div className="form-success-alert">{success}</div>}

        <form onSubmit={handleSubmit} className="standard-styled-form">
          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="meterId">Device ID / Meter ID *</label>
              <input id="meterId" name="meterId" type="text" required placeholder="e.g. MTR-0042" />
            </div>
            <div className="form-field-group">
              <label htmlFor="zone">Zone / Location</label>
              <input id="zone" name="zone" type="text" placeholder="e.g. Zone A" />
            </div>
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="simNumber">SIM / GSM Number</label>
              <input id="simNumber" name="simNumber" type="text" placeholder="e.g. +251912345678" />
            </div>
            <div className="form-field-group">
              <label htmlFor="firmwareVersion">Firmware Version</label>
              <input id="firmwareVersion" name="firmwareVersion" type="text" placeholder="e.g. v1.2.0" />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="notes">Notes (optional)</label>
            <input id="notes" name="notes" type="text" placeholder="Installation notes or comments" />
          </div>

          <div className="form-actions-row right-aligned">
            <Link href="/devices" className="btn-outline-gray">Cancel</Link>
            <button type="submit" className="btn-primary-blue" disabled={loading}>
              {loading ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
