import { redirect, notFound } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getDevice, getDeviceReadings } from '../../../lib/admin-api';
import { getServerToken } from '../../../lib/auth';
import { DeviceDetailClient } from './device-detail-client';

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

    return (
      <AdminShell currentPath="/devices" title="Device Detail">
        <DeviceDetailClient device={device} readings={readings} token={token} />
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
          <a href="/devices" style={{ color: '#2563eb', textDecoration: 'underline' }}>← Back to Devices</a>
        </div>
      </AdminShell>
    );
  }
}
