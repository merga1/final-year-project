import { SectionPage } from '../../components/section-page';

export default function BillingPage() {
  return (
    <SectionPage
      currentPath="/billing"
      title="Billing"
      description="Review generated bills, due dates, and customer accounts that need follow-up."
      status="Stable"
      stats={[
        { label: 'Bills This Month', value: '624' },
        { label: 'Overdue Bills', value: '37' },
        { label: 'Collected', value: 'ETB 248K' },
        { label: 'Pending', value: 'ETB 41K' },
      ]}
      tableTitle="Billing Queue"
      rows={[
        { primary: 'INV-3001', secondary: 'Abel Tesfaye • Due in 5 days', status: 'Pending' },
        { primary: 'INV-3014', secondary: 'Liya Bekele • Overdue by 3 days', status: 'Danger' },
        { primary: 'INV-3028', secondary: 'Meron Alemu • Paid and posted', status: 'Verified' },
      ]}
    />
  );
}
