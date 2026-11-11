import { redirect } from 'next/navigation';
import { getServerToken } from '../../lib/auth';
import { AdminShell } from '../../components/admin-shell';
import { getAuditLogs } from '../../lib/admin-api';
import { AuditClient } from './audit-client';

export default async function AuditPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const logs = await getAuditLogs(token);

    return (
      <AdminShell
        currentPath="/audit"
        title="Audit Trail & Change History"
        description="Review chronological, immutable logs of all administrative actions, valve states, and system interventions (SRS NFR-A07)."
        status="Secure"
      >
        <AuditClient logs={logs} />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell
        currentPath="/audit"
        title="Audit Trail & Change History"
        description="Review chronological, immutable logs of all administrative actions, valve states, and system interventions (SRS NFR-A07)."
        status="Secure"
      >
        <AuditClient logs={[]} />
      </AdminShell>
    );
  }
}
