import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getServerToken, getServerUser } from '../../lib/auth';
import ProfileClient from './profile-client';

export default async function ProfilePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  const user = await getServerUser();

  return (
    <AdminShell currentPath="/profile" title="Administrator Profile">
      <ProfileClient user={user} token={token} />
    </AdminShell>
  );
}
