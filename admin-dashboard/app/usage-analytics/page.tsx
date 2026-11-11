import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getDailyUsage, getDevices, getReadings, getZoneUsage, getQualityTrend } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';
import { UsageAnalyticsClient } from './usage-analytics-client';

export default async function UsageAnalyticsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [dailyUsage, zoneUsage, qualityTrend, devices, readings] = await Promise.all([
      getDailyUsage(token).catch(() => []),
      getZoneUsage(token).catch(() => []),
      getQualityTrend(token).catch(() => []),
      getDevices(token).catch(() => []),
      getReadings(token).catch(() => []),
    ]);

    return (
      <AdminShell
        currentPath="/usage-analytics"
        title="Usage & Water Analytics"
        description="Multi-dimensional telemetry: volumetric flow, operational zone allocation, and water purity (SRS AD-42)."
        status="Stable"
      >
        <UsageAnalyticsClient
          dailyUsage={dailyUsage}
          zoneUsage={zoneUsage}
          qualityTrend={qualityTrend}
          devices={devices}
          recentReadings={readings}
          token={token}
        />
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) redirect('/login');
    return (
      <AdminShell
        currentPath="/usage-analytics"
        title="Usage Analytics"
        description="Daily consumption patterns, water quality trends, and meter readings."
      >
        <UsageAnalyticsClient
          dailyUsage={[]}
          zoneUsage={[]}
          qualityTrend={[]}
          devices={[]}
          recentReadings={[]}
          token={token}
        />
      </AdminShell>
    );
  }
}
