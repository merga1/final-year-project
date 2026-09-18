import { redirect } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getServerToken } from '../../../lib/auth';
import AddCustomerClient from './add-customer-client';

export default async function NewCustomerPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  return (
    <AdminShell currentPath="/customers/new">
      <AddCustomerClient />
    </AdminShell>
  );
}
