import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getBilling } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function BillingPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const bills = await getBilling(token);
    const pending = bills.filter(b => b.status === 'pending').length;
    const overdue = bills.filter(b => b.status === 'overdue').length;
    const paid = bills.filter(b => b.status === 'paid');
    const collected = paid.reduce((sum: number, b: any) => sum + b.amountEtb, 0);
    const pendingAmt = bills.filter(b => b.status !== 'paid').reduce((sum: number, b: any) => sum + b.amountEtb, 0);

    const statusLabel = (s: string) =>
      s === 'paid' ? 'Verified' : s === 'overdue' ? 'Danger' : 'Pending';

    return (
      <SectionPage
        currentPath="/billing"
        title="Billing"
        description="Review generated bills, due dates, and accounts that need follow-up."
        status={overdue === 0 ? 'Stable' : 'Warning'}
        stats={[
          { label: 'Bills This Month', value: String(bills.length) },
          { label: 'Overdue Bills', value: String(overdue) },
          { label: 'Collected', value: `ETB ${(collected / 1000).toFixed(1)}K` },
          { label: 'Pending', value: `ETB ${(pendingAmt / 1000).toFixed(1)}K` },
        ]}
        tableTitle="Billing Queue"
        rows={bills.slice(0, 10).map(b => ({
          primary: `INV-${b.id.slice(0, 6).toUpperCase()}`,
          secondary: `${b.customerName} • Due: ${b.dueDate} • ETB ${b.amountEtb}`,
          status: statusLabel(b.status),
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
