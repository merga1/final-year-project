import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const customers = await getCustomers(token);
    return (
      <AdminShell currentPath="/customers" title="Customers">
        <CustomersClient customers={customers} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
