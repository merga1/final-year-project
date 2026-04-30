import { SectionPage } from '../../components/section-page';

export default function CustomersPage() {
  return (
    <SectionPage
      currentPath="/customers"
      title="Customers"
      description="Manage customer records, water accounts, and current billing status."
      status="Stable"
      stats={[
        { label: 'Registered Customers', value: '624' },
        { label: 'Active Accounts', value: '603' },
        { label: 'Suspended Accounts', value: '21' },
        { label: 'New This Week', value: '18' },
      ]}
      tableTitle="Recent Customer Activity"
      rows={[
        { primary: 'Abel Tesfaye', secondary: 'ESP32-001 • Last payment 2 days ago', status: 'Verified' },
        { primary: 'Liya Bekele', secondary: 'ESP32-018 • Usage warning this morning', status: 'Warning' },
        { primary: 'Meron Alemu', secondary: 'ESP32-042 • Account under review', status: 'In Review' },
      ]}
    />
  );
}
