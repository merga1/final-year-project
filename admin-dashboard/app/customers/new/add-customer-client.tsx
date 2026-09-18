'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddCustomerClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      dateOfBirth: fd.get('dateOfBirth') as string,
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      address: fd.get('address') as string,
    };

    try {
      const res = await fetch('http://localhost:4000/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('sw_token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to add customer');
        return;
      }

      router.push('/customers');
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
        <div className="form-header-row">
          <h2 className="form-card-title">Add Customer</h2>
          <Link href="/customers" className="btn-outline-gray">
            Back to Customers
          </Link>
        </div>

        {error && <div className="form-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-styled-form">
          <div className="form-field-group full-width">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Email address"
            />
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Password (at least 6 characters)"
            />
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              placeholder="mm/dd/yyyy"
            />
          </div>

          <div className="form-row-two-col">
            <div className="form-field-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="First Name"
              />
            </div>
            <div className="form-field-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="Last Name"
              />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="Address"
            />
          </div>

          <div className="form-actions-row left-aligned">
            <button type="submit" className="btn-primary-blue" disabled={loading}>
              {loading ? 'Adding…' : 'Add Customer'}
            </button>
            <button
              type="button"
              className="btn-outline-gray"
              onClick={() => router.push('/customers')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
