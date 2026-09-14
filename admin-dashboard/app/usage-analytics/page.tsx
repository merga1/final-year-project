import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { UsageLineChart, UsageBarChart } from '../../components/usage-chart';
import { getDailyUsage, getDevices } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function UsageAnalyticsPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const [dailyUsage, devices] = await Promise.all([
      getDailyUsage(token),
      getDevices(token),
    ]);

    const totalL = dailyUsage.reduce((s, d) => s + parseFloat(d.usageLiters), 0);
    const avgDaily = dailyUsage.length ? (totalL / dailyUsage.length).toFixed(0) : '0';
    const leakSignals = devices.filter(d => d.connectivity === 'ONLINE').length; // simplified

    return (
      <AdminShell
        currentPath="/usage-analytics"
        title="Usage Analytics"
        description="Review system-wide consumption patterns, suspected leaks, and peak usage windows."
        status="Stable"
      >
        <section className="grid">
          <article className="card">
            <span>Avg Daily Usage</span>
            <strong>{Number(avgDaily).toLocaleString()} L</strong>
          </article>
          <article className="card">
            <span>7-Day Total</span>
            <strong>{totalL.toLocaleString(undefined, { maximumFractionDigits: 0 })} L</strong>
          </article>
          <article className="card">
            <span>Active Devices</span>
            <strong>{devices.filter(d => d.connectivity === 'ONLINE').length}</strong>
          </article>
          <article className="card">
            <span>Data Points</span>
            <strong>{dailyUsage.length * devices.length}</strong>
          </article>
        </section>

        <section className="panels" style={{ gridTemplateColumns: '1fr' }}>
          <article className="panel">
            <h3>7-Day System Usage Trend</h3>
            <UsageLineChart data={dailyUsage} />
          </article>

          <article className="panel" style={{ marginTop: 16 }}>
            <h3>Daily Usage Distribution</h3>
            <UsageBarChart data={dailyUsage} />
          </article>
        </section>
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
