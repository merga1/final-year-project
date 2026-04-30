import { SectionPage } from '../../components/section-page';

export default function AlertsPage() {
  return (
    <SectionPage
      currentPath="/alerts"
      title="Alerts"
      description="Inspect anomalies from devices, water quality thresholds, and failed transmissions."
      status="Stable"
      stats={[
        { label: 'Critical Today', value: '3' },
        { label: 'Acknowledged', value: '17' },
        { label: 'Open Alerts', value: '8' },
        { label: 'Escalated', value: '2' },
      ]}
      tableTitle="Active Alerts"
      rows={[
        { primary: 'ALT-120', secondary: 'ESP32-018 • High usage spike', status: 'Warning' },
        { primary: 'ALT-121', secondary: 'ESP32-042 • Device offline', status: 'Danger' },
        { primary: 'ALT-122', secondary: 'ESP32-001 • Safe after reset', status: 'Resolved' },
      ]}
    />
  );
}
