import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getServerToken, getServerUser } from '../../lib/auth';
import ProfileClient from './profile-client';

export default async function ProfilePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  const user = await getServerUser();
  const email = user?.email || 'admin2@gmail.com';

  return (
    <AdminShell currentPath="/profile">
      <ProfileClient email={email} />
    </AdminShell>
  );
}
