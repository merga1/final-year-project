import { SectionPage } from '../../components/section-page';

export default function SupportTicketsPage() {
  return (
    <SectionPage
      currentPath="/support-tickets"
      title="Support Tickets"
      description="Manage service issues, assignment, and response progress across the field team."
      status="Stable"
      stats={[
        { label: 'Open Tickets', value: '14' },
        { label: 'Assigned', value: '9' },
        { label: 'Resolved Today', value: '5' },
        { label: 'Breached SLA', value: '1' },
      ]}
      tableTitle="Ticket Queue"
      rows={[
        { primary: 'TCK-1005', secondary: 'Poor water quality • Assigned to Hana', status: 'Scheduled' },
        { primary: 'TCK-1006', secondary: 'Valve not responding • Waiting on site visit', status: 'Pending' },
        { primary: 'TCK-1007', secondary: 'Billing dispute • Customer callback complete', status: 'Resolved' },
      ]}
    />
  );
}
