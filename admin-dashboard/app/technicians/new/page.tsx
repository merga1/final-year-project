import { redirect } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getServerToken } from '../../../lib/auth';
import AddTechnicianClient from './add-technician-client';

export default async function NewTechnicianPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  return (
    <AdminShell currentPath="/technicians/new">
      <AddTechnicianClient />
    </AdminShell>
  );
}
