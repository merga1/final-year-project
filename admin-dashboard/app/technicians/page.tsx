import { SectionPage } from '../../components/section-page';

export default function TechniciansPage() {
  return (
    <SectionPage
      currentPath="/technicians"
      title="Technicians"
      description="Monitor field staff workload, availability, and current service assignments."
      status="Stable"
      stats={[
        { label: 'Technicians', value: '18' },
        { label: 'On Duty', value: '12' },
        { label: 'Assigned Jobs', value: '9' },
        { label: 'Free Capacity', value: '6' },
      ]}
      tableTitle="Technician Activity"
      rows={[
        { primary: 'Hana Wolde', secondary: '2 open tickets • Zone A', status: 'Scheduled' },
        { primary: 'Samuel Desta', secondary: 'Available for assignment', status: 'Online' },
        { primary: 'Ruth Mamo', secondary: 'Site inspection delayed by weather', status: 'Warning' },
      ]}
    />
  );
}
