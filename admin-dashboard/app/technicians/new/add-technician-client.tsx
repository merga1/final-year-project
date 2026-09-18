'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AddTechnicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      hireDate: fd.get('hireDate') as string,
      address: fd.get('address') as string,
      specialization: fd.get('specialization') as string,
      qualifications: fd.get('qualifications') as string,
    };

    try {
      const res = await fetch('http://localhost:4000/api/admin/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('sw_token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to add technician');
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
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  }

  return (
    <div className="section-container">
      <div className="form-card-container">
        <h2 className="form-card-title">Add New Technician</h2>

        {error && <div className="form-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-styled-form">
          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" type="text" required placeholder="First Name" />
            </div>
            <div className="form-field-group">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" type="text" required placeholder="Last Name" />
            </div>
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required placeholder="Email" />
            </div>
            <div className="form-field-group">
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="Phone Number" />
            </div>
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="hireDate">Hire Date</label>
              <input id="hireDate" name="hireDate" type="date" />
            </div>
            <div className="form-field-group">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" placeholder="Address" />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="specialization">Specialization</label>
            <select id="specialization" name="specialization" defaultValue="">
              <option value="" disabled>Select areas of expertise</option>
              <option value="Leak Detection & Pump Systems">Leak Detection & Pump Systems</option>
              <option value="Smart Meter Calibration">Smart Meter Calibration</option>
              <option value="Water Quality & Filtration">Water Quality & Filtration</option>
              <option value="Pipeline Infrastructure">Pipeline Infrastructure</option>
              <option value="General Diagnostics">General Diagnostics</option>
            </select>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="qualifications">Qualifications/Certifications</label>
            <input
              id="qualifications"
              name="qualifications"
              type="text"
              placeholder="Qualifications/Certifications"
            />
          </div>

          <div className="form-actions-row right-aligned">
            <button type="submit" className="btn-primary-blue" disabled={loading}>
              {loading ? 'Adding…' : 'Add Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
