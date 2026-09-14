import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function CustomersPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const customers = await getCustomers(token);
    const active = customers.filter(c => c.accountStatus === 'active').length;
    const suspended = customers.filter(c => c.accountStatus === 'suspended').length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const newThisWeek = customers.filter(c => new Date(c.createdAt) > thisWeek).length;

    return (
      <SectionPage
        currentPath="/customers"
        title="Customers"
        description="Manage customer records, water accounts, and current billing status."
        status="Stable"
        stats={[
          { label: 'Registered Customers', value: String(customers.length) },
          { label: 'Active Accounts', value: String(active) },
          { label: 'Suspended Accounts', value: String(suspended) },
          { label: 'New This Week', value: String(newThisWeek) },
        ]}
        tableTitle="Customer Accounts"
        rows={customers.slice(0, 10).map(c => ({
          primary: c.name,
          secondary: `${c.email} • ${c.zone} • Meter: ${c.meterId ?? 'Unassigned'}`,
          status: c.accountStatus === 'active' ? 'Verified' : c.accountStatus === 'suspended' ? 'Danger' : 'Pending',
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
