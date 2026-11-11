import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getDevices, getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { DevicesClient } from './devices-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function DevicesPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [devices, customers] = await Promise.all([
      getDevices(token),
      getCustomers(token).catch(() => []),
    ]);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    const enriched = (devices || []).map((d: any) => {
      const cust = d.customerId ? customerMap.get(d.customerId) : null;
      let rawName = cust?.name;
      if (!rawName && (cust?.firstName || cust?.lastName)) {
        rawName = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim();
      }
      return {
        ...d,
        customerName: rawName ? toTitleCase(rawName) : null,
        customerEmail: cust?.email ?? null,
      };
    });

    return (
      <AdminShell currentPath="/devices" title="Devices">
        <DevicesClient devices={enriched} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/devices" title="Devices">
        <DevicesClient devices={[]} token={token} />
      </AdminShell>
    );
  }
}
