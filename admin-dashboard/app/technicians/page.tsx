import { redirect } from 'next/navigation';
import { SectionPage } from '../../components/section-page';
import { getTechnicians } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function TechniciansPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const techs = await getTechnicians(token);
    const onDuty = techs.filter(t => t.status === 'on_duty').length;
    const assigned = techs.filter(t => t.currentJobCount > 0).length;
    const free = techs.filter(t => t.status === 'on_duty' && t.currentJobCount === 0).length;

    const statusLabel = (t: any) =>
      t.status === 'off_duty' ? 'Offline' :
      t.currentJobCount > 0 ? 'Scheduled' : 'Online';

    return (
      <SectionPage
        currentPath="/technicians"
        title="Technicians"
        description="Monitor field staff workload, availability, and current service assignments."
        status="Stable"
        stats={[
          { label: 'Technicians', value: String(techs.length) },
          { label: 'On Duty', value: String(onDuty) },
          { label: 'Assigned Jobs', value: String(assigned) },
          { label: 'Free Capacity', value: String(free) },
        ]}
        tableTitle="Technician Activity"
        rows={techs.slice(0, 10).map(t => ({
          primary: t.name,
          secondary: `${t.zone} • ${t.currentJobCount} active job(s) • ${t.phone ?? ''}`,
          status: statusLabel(t),
        }))}
      />
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
