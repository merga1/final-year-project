import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getAlerts } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function AlertsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const alerts = await getAlerts(token);
    const critical = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const acknowledged = alerts.filter(a => a.acknowledged).length;
    const open = alerts.filter(a => !a.acknowledged).length;
    const escalated = alerts.filter(a => a.severity === 'critical').length;

    const severityLabel = (a: any) =>
      a.acknowledged ? 'Resolved' : a.severity === 'critical' ? 'Danger' : 'Warning';

    return (
      <SectionPage
        currentPath="/alerts"
        title="Alerts"
        description="Inspect anomalies from devices, water quality thresholds, and failed transmissions."
        status={critical === 0 ? 'Stable' : 'Warning'}
        stats={[
          { label: 'Critical Unacknowledged', value: String(critical) },
          { label: 'Acknowledged', value: String(acknowledged) },
          { label: 'Open Alerts', value: String(open) },
          { label: 'Escalated', value: String(escalated) },
        ]}
        tableTitle="Active Alerts"
        rows={alerts.slice(0, 10).map(a => ({
          primary: `ALT-${a.id.slice(0, 6).toUpperCase()}`,
          secondary: `${a.meterId} • ${a.message}`,
          status: severityLabel(a),
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
