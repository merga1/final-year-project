import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getAlerts } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { AlertsClient } from './alerts-client';

export default async function AlertsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const alerts = await getAlerts(token);
    return (
      <AdminShell currentPath="/alerts" title="Alerts">
        <AlertsClient alerts={alerts} token={token} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
