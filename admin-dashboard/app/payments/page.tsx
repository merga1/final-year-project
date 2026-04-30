import { SectionPage } from '../../components/section-page';

export default function PaymentsPage() {
  return (
    <SectionPage
      currentPath="/payments"
      title="Payments"
      description="Verify incoming customer payments and identify entries that need confirmation."
      status="Stable"
      stats={[
        { label: 'Verified Today', value: '46' },
        { label: 'Pending Review', value: '9' },
        { label: 'Failed Attempts', value: '2' },
        { label: 'Disputes', value: '1' },
      ]}
      tableTitle="Payment Verification"
      rows={[
        { primary: 'PAY-9001', secondary: 'Chappa payment • Abel Tesfaye', status: 'Verified' },
        { primary: 'PAY-9002', secondary: 'Bank transfer • Needs receipt check', status: 'Pending' },
        { primary: 'PAY-9003', secondary: 'Mobile payment • Duplicate reference', status: 'In Review' },
      ]}
    />
  );
}
