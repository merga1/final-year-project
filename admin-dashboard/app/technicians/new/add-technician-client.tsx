'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddTechnicianPage({ token }: { token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const address = fd.get('address') as string;
    const body = {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      phone: fd.get('phone') as string,
      hireDate: fd.get('hireDate') as string,
      address,
      zone: address,
      specialization: fd.get('specialization') as string,
      qualifications: fd.get('qualifications') as string,
    };

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-five-liart-75.vercel.app').replace(String.fromCharCode(0xFEFF), '').trim();
      const res = await fetch(`${API}/api/admin/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || getCookie('sw_token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message || 'Failed to add technician');
        setError(msg);
        return;
      }

      router.push('/technicians');
      router.refresh();
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
    <div className="section-container">
      <Link href="/technicians" className="back-link">Back to Technicians</Link>
      <div className="form-card-container">
        <h2 className="form-card-title">Add New Technician</h2>

        {error && <div className="form-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-styled-form">
          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="firstName">First Name *</label>
              <input id="firstName" name="firstName" type="text" required placeholder="First Name" />
            </div>
            <div className="form-field-group">
              <label htmlFor="lastName">Last Name *</label>
              <input id="lastName" name="lastName" type="text" required placeholder="Last Name" />
            </div>
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="email">Email address *</label>
              <input id="email" name="email" type="email" required placeholder="technician@example.com" />
            </div>
            <div className="form-field-group">
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="+251..." />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="password">Temporary Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
              Share this password with the technician. They sign in from the mobile app and can change it from their profile.
            </small>
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="hireDate">Hire Date</label>
              <input id="hireDate" name="hireDate" type="date" />
            </div>
            <div className="form-field-group">
              <label htmlFor="address">Service Area / Zone</label>
              <input id="address" name="address" type="text" placeholder="Zone A, Bole" />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="specialization">Specialization</label>
            <select id="specialization" name="specialization" defaultValue="">
              <option value="" disabled>Select areas of expertise</option>
              <option value="Leak Detection & Pump Systems">Leak Detection &amp; Pump Systems</option>
              <option value="Smart Meter Calibration">Smart Meter Calibration</option>
              <option value="Water Quality & Filtration">Water Quality &amp; Filtration</option>
              <option value="Pipeline Infrastructure">Pipeline Infrastructure</option>
              <option value="General Diagnostics">General Diagnostics</option>
            </select>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="qualifications">Qualifications / Certifications</label>
            <input
              id="qualifications"
              name="qualifications"
              type="text"
              placeholder="e.g. Certified Water Meter Tech, Electrical LV"
            />
          </div>

          <div className="form-actions-row right-aligned">
            <Link href="/technicians" className="btn-outline-gray">Cancel</Link>
            <button type="submit" className="btn-primary-blue" disabled={loading}>
              {loading ? 'Adding Technician...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
