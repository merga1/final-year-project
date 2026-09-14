import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getPayments } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function PaymentsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const payments = await getPayments(token);
    const verified = payments.filter(p => p.status === 'verified').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    const disputed = payments.filter(p => p.status === 'disputed').length;

    const statusLabel = (s: string) =>
      s === 'verified' ? 'Verified' : s === 'failed' ? 'Danger' : s === 'disputed' ? 'In Review' : 'Pending';

    return (
      <SectionPage
        currentPath="/payments"
        title="Payments"
        description="Verify incoming customer payments and identify entries that need confirmation."
        status="Stable"
        stats={[
          { label: 'Verified Today', value: String(verified) },
          { label: 'Pending Review', value: String(pending) },
          { label: 'Failed Attempts', value: String(failed) },
          { label: 'Disputes', value: String(disputed) },
        ]}
        tableTitle="Payment Verification"
        rows={payments.slice(0, 10).map(p => ({
          primary: `PAY-${p.id.slice(0, 6).toUpperCase()}`,
          secondary: `${p.method.replace('_', ' ')} • ${p.customerName} • ETB ${p.amount}`,
          status: statusLabel(p.status),
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
