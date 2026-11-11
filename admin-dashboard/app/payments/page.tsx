import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getPayments, getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { PaymentsClient } from './payments-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function PaymentsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [payments, customers] = await Promise.all([
      getPayments(token),
      getCustomers(token).catch(() => []),
    ]);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    const enrichedPayments = (payments || []).map((p: any) => {
      const cust = p.customerId ? customerMap.get(p.customerId) : null;
      let realName = cust?.name || (cust?.firstName ? `${cust.firstName} ${cust.lastName}` : null);
      if (!realName && p.customerName && p.customerName !== 'Customer') {
        realName = p.customerName;
      }

      return {
        ...p,
        customerName: realName ? toTitleCase(realName) : (p.customerName || 'Customer'),
      };
    });

    return (
      <AdminShell currentPath="/payments" title="Payments">
        <PaymentsClient payments={enrichedPayments} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/payments" title="Payments">
        <PaymentsClient payments={[]} />
      </AdminShell>
    );
  }
}
