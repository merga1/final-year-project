import { redirect, notFound } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getCustomer, getDevices } from '../../../lib/admin-api';
import { getServerToken } from '../../../lib/auth';
import { CustomerDetailClient } from './customer-detail-client';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [customer, devices] = await Promise.all([
      getCustomer(token, id),
      getDevices(token).catch(() => []),
    ]);

    if (!customer) notFound();

    return (
      <AdminShell currentPath="/customers" title="Customer Detail">
        <CustomerDetailClient customer={customer} devices={devices} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    if (e.message?.includes('404') || e.message?.includes('not found')) notFound();
    return (
      <AdminShell currentPath="/customers" title="Customer Detail">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Failed to load customer</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>{e.message ?? 'An unexpected error occurred.'}</p>
          <a href="/customers" style={{ color: '#1e6b52', textDecoration: 'underline' }}>← Back to Customers</a>
        </div>
      </AdminShell>
    );
  }
}
