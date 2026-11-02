import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getBilling, getPayments } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { BillingClient } from './billing-client';

export default async function BillingPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [bills, payments] = await Promise.all([
      getBilling(token),
      getPayments(token).catch(() => []),
    ]);

    return (
      <AdminShell currentPath="/billing" title="Billing">
        <BillingClient bills={bills} payments={payments} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
