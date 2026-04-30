import { SectionPage } from '../../components/section-page';

export default function DevicesPage() {
  return (
    <SectionPage
      currentPath="/devices"
      title="Devices"
      description="Track device health, GSM connectivity, readings, and valve responsiveness."
      status="Stable"
      stats={[
        { label: 'Installed Devices', value: '128' },
        { label: 'Online Now', value: '121' },
        { label: 'Offline', value: '4' },
        { label: 'Needs Inspection', value: '3' },
      ]}
      tableTitle="Device Status"
      rows={[
        { primary: 'ESP32-001', secondary: 'Abel Tesfaye • Safe turbidity', status: 'Online' },
        { primary: 'ESP32-018', secondary: 'Liya Bekele • High usage trend', status: 'Warning' },
        { primary: 'ESP32-042', secondary: 'Meron Alemu • No sync for 22 mins', status: 'Offline' },
      ]}
    />
  );
}
