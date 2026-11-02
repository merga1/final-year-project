import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getPayments } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { PaymentsClient } from './payments-client';

export default async function PaymentsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const payments = await getPayments(token);

    return (
      <AdminShell currentPath="/payments" title="Payments">
        <PaymentsClient payments={payments} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
