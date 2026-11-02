import { redirect } from 'next/navigation';
import { AdminShell } from '../../../components/admin-shell';
import { getServerToken } from '../../../lib/auth';
import { RegisterDeviceClient } from './register-device-client';

export default async function RegisterDevicePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  return (
    <AdminShell currentPath="/devices" title="Register Device">
      <RegisterDeviceClient token={token} />
    </AdminShell>
  );
}
