import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getBilling, getPayments, getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { BillingClient } from './billing-client';

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function BillingPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [bills, payments, customers] = await Promise.all([
      getBilling(token),
      getPayments(token).catch(() => []),
      getCustomers(token).catch(() => []),
    ]);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    const enrichedBills = (bills || []).map((bill: any) => {
      const cust = bill.customerId ? customerMap.get(bill.customerId) : null;
      let realName = cust?.name || (cust?.firstName ? `${cust.firstName} ${cust.lastName}` : null);
      if (!realName && bill.customerName && bill.customerName !== 'Customer') {
        realName = bill.customerName;
      }

      return {
        ...bill,
        customerName: realName ? toTitleCase(realName) : 'Customer',
      };
    });

    return (
      <AdminShell currentPath="/billing" title="Billing">
        <BillingClient bills={enrichedBills} payments={payments} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell currentPath="/billing" title="Billing">
        <BillingClient bills={[]} payments={[]} />
      </AdminShell>
    );
  }
}
