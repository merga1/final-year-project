import { redirect, notFound } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getDevice, getDeviceReadings, getCustomer } from '../../../lib/admin-api';
import { getServerToken } from '../../../lib/auth';
import { DeviceDetailClient } from './device-detail-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [device, readings] = await Promise.all([
      getDevice(token, id),
      getDeviceReadings(token, id).catch(() => []),
    ]);

    if (!device) notFound();

    let customerName = null;
    if (device.customerId) {
      try {
        const cust = await getCustomer(token, device.customerId);
        let raw = cust?.name;
        if (!raw && (cust?.firstName || cust?.lastName)) {
          raw = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim();
        }
        if (raw) customerName = toTitleCase(raw);
      } catch {
        // Customer lookup failed or not found
      }
    }

    return (
      <AdminShell currentPath="/devices" title="Device Detail">
        <DeviceDetailClient
          device={{ ...device, customerName }}
          readings={readings}
          token={token}
        />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    if (e.message?.includes('404') || e.message?.includes('not found')) notFound();
    return (
      <AdminShell currentPath="/devices" title="Device Detail">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Failed to load device</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>{e.message ?? 'An unexpected error occurred.'}</p>
          <a href="/devices" style={{ color: '#1e6b52', textDecoration: 'underline' }}>← Back to Devices</a>
        </div>
      </AdminShell>
    );
  }
}
