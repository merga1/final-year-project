import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getDevices } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { DevicesClient } from './devices-client';

export default async function DevicesPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const devices = await getDevices(token);
    return (
      <AdminShell currentPath="/devices" title="Devices">
        <DevicesClient devices={devices} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
