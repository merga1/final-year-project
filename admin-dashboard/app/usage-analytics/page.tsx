import { SectionPage } from '../../components/section-page';

export default function UsageAnalyticsPage() {
  return (
    <SectionPage
      currentPath="/usage-analytics"
      title="Usage Analytics"
      description="Review system-wide consumption patterns, suspected leaks, and peak usage windows."
      status="Stable"
      stats={[
        { label: 'Avg Daily Usage', value: '18.4 m3' },
        { label: 'Peak Hour', value: '07:00' },
        { label: 'Leak Signals', value: '6' },
        { label: 'Monthly Growth', value: '+4.8%' },
      ]}
      tableTitle="Usage Signals"
      rows={[
        { primary: 'Zone A', secondary: 'Morning peak increased by 12%', status: 'Warning' },
        { primary: 'Zone B', secondary: 'Usage within normal range', status: 'Stable' },
        { primary: 'Zone C', secondary: 'Possible continuous overnight flow', status: 'Danger' },
      ]}
    />
  );
}
