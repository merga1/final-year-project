import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getDevices } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function DevicesPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const devices = await getDevices(token);
    const online = devices.filter(d => d.connectivity === 'ONLINE').length;
    const offline = devices.filter(d => d.connectivity === 'OFFLINE').length;
    const warning = devices.filter(d => d.connectivity === 'WARNING').length;

    return (
      <SectionPage
        currentPath="/devices"
        title="Devices"
        description="Track device health, connectivity, readings, and valve responsiveness."
        status={offline === 0 ? 'Stable' : 'Warning'}
        stats={[
          { label: 'Installed Devices', value: String(devices.length) },
          { label: 'Online Now', value: String(online) },
          { label: 'Offline', value: String(offline) },
          { label: 'Warning', value: String(warning) },
        ]}
        tableTitle="Device Status"
        rows={devices.slice(0, 10).map(d => ({
          primary: d.meterId,
          secondary: `Zone: ${d.zone} • Valve: ${d.valveState} • Battery: ${d.batteryPercent}%`,
          status: d.connectivity === 'ONLINE' ? 'Online' : d.connectivity === 'WARNING' ? 'Warning' : 'Offline',
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
