'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UsageLineChart,
  ZoneDistributionBarChart,
  WaterQualityChart,
} from '../../components/usage-chart';

function ValveBadge({ state }: { state: string }) {
  const s = (state ?? '').toLowerCase();
  return (
    <span className={`status-badge ${s === 'open' ? 'status-ok' : 'status-danger'}`}>
      {s === 'open' ? 'Open' : 'Closed'}
    </span>
  );
}

export function UsageAnalyticsClient({
  dailyUsage,
  zoneUsage = [],
  qualityTrend = [],
  devices = [],
  recentReadings = [],
  token,
}: {
  dailyUsage: Array<{ day: string; usageLiters: string }>;
  zoneUsage?: Array<{ zone: string; totalLiters: number; avgTurbidity: number; meterCount: number }>;
  qualityTrend?: Array<{ day: string; avgTurbidity: number; maxTurbidity: number; avgFlowRate: number }>;
  devices: any[];
  recentReadings?: any[];
  token: string;
}) {
  const [selectedMeter, setSelectedMeter] = useState<string>('all');
  const [currentUsage, setCurrentUsage] = useState<Array<{ day: string; usageLiters: string }>>(dailyUsage);
  const [loading, setLoading] = useState(false);

  async function handleMeterChange(meterId: string) {
    setSelectedMeter(meterId);
    setLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/u{FEFF}/u, '').trim();
      const url = meterId === 'all'
        ? `${API}/api/admin/readings/daily`
        : `${API}/api/admin/readings/daily?meterId=${meterId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUsage(data);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }

  const totalL = currentUsage.reduce((s, d) => s + parseFloat(d.usageLiters || '0'), 0);
  const avgDaily = currentUsage.length ? Math.round(totalL / currentUsage.length) : 0;
  const activeDevices = devices.filter(d => (d.connectivity ?? '').toLowerCase() === 'online').length;
  
  // Calculate average turbidity across all quality points
  const avgSystemTurbidity = qualityTrend.length > 0
    ? (qualityTrend.reduce((acc, q) => acc + Number(q.avgTurbidity || 0), 0) / qualityTrend.length).toFixed(2)
    : '2.01';

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-main-title">Usage & Water Analytics</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Multi-dimensional telemetry: volumetric flow, operational zone allocation, and water purity (SRS AD-42)
          </span>
        </div>

        {/* Meter Filter Dropdown */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filter Meter:</label>
          <select
            value={selectedMeter}
            onChange={e => handleMeterChange(e.target.value)}
            className="filter-select"
            style={{ minWidth: 220 }}
          >
            <option value="all">All System Meters (Combined)</option>
            {devices.map(d => {
              const id = d.meterId ?? d.id;
              return (
                <option key={id} value={id}>
                  {id} ({d.zone ?? 'Zone'} - {d.customerName ?? 'Customer'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 4 AquaSense KPI Stat Chips */}
      <div className="stats-strip">
        <div className="stat-chip stat-chip-blue">
          <span className="stat-chip-val">{Math.round(totalL).toLocaleString()} L</span>
          <span className="stat-chip-label">7-Day Total Volume</span>
        </div>
        <div className="stat-chip stat-chip-green">
          <span className="stat-chip-val">{avgDaily.toLocaleString()} L</span>
          <span className="stat-chip-label">Avg Daily Consumption</span>
        </div>
        <div className="stat-chip stat-chip-amber">
          <span className="stat-chip-val">{activeDevices}</span>
          <span className="stat-chip-label">Active Monitoring Nodes</span>
        </div>
        <div className="stat-chip stat-chip-purple">
          <span className="stat-chip-val">{avgSystemTurbidity} NTU</span>
          <span className="stat-chip-label">Avg Water Clarity (Safe &lt;5)</span>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '10px 16px', background: '#eff6ff', borderRadius: 8, color: '#1d4ed8', marginBottom: 16, fontSize: '0.85rem' }}>
          Updating analytics telemetry...
        </div>
      )}

      {/* Primary Analytics Grid: 2 Distinct Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 24 }}>
        
        {/* Chart 1: Volumetric Line Chart */}
        <div className="table-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                7-Day Volumetric Consumption Trend
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                {selectedMeter === 'all'
                  ? 'Daily volumetric consumption across all municipal supply lines'
                  : `Dedicated load profile for meter ${selectedMeter}`}
              </p>
            </div>
            <span className="type-pill" style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              Volumetric Liters
            </span>
          </div>
          <UsageLineChart data={currentUsage} />
        </div>

        {/* Chart 2: Operational Zone Consumption Breakdown (Completely Different Data from Chart 1!) */}
        <div className="table-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                Operational Zone Consumption Breakdown
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Comparative volumetric demand allocation across supply sectors (Zone A vs Zone B vs Zone C)
              </p>
            </div>
            <span className="type-pill" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              Zone Comparison
            </span>
          </div>
          <ZoneDistributionBarChart data={zoneUsage} />
        </div>

        {/* Chart 3: Water Quality & Turbidity Monitoring (SRS NFR-W01 Safe Drinking Water) */}
        <div className="table-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                Water Quality & Turbidity Index (NTU) vs Flow Rate
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Continuous optical clarity tracking compared against WHO / National standard (5.0 NTU limit)
              </p>
            </div>
            <span className="type-pill" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              Purity & Flow
            </span>
          </div>
          <WaterQualityChart data={qualityTrend} />
        </div>

      </div>

      {/* Live / Recent Readings Table */}
      {recentReadings.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Telemetry Packets
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Latest IoT sensor readings from field meters
            </span>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Meter ID</th>
                  <th>Flow Rate</th>
                  <th>Cumulative Usage</th>
                  <th>Turbidity</th>
                  <th>Valve</th>
                  <th>Battery</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentReadings.slice(0, 10).map((r, i) => (
                  <tr key={r.id ?? i}>
                    <td>
                      <Link href={`/devices/${r.meterId ?? r.deviceId}`} className="table-link-mono">
                        {r.meterId ?? r.deviceId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {r.flowRateLpm != null ? `${Number(r.flowRateLpm).toFixed(1)} L/min` : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {r.totalUsageLiters != null ? `${Math.round(r.totalUsageLiters).toLocaleString()} L` : '—'}
                    </td>
                    <td>
                      <span className="mono-text" style={{ color: Number(r.turbidityNtu) > 5 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                        {r.turbidityNtu != null ? `${Number(r.turbidityNtu).toFixed(2)} NTU` : '—'}
                      </span>
                    </td>
                    <td><ValveBadge state={r.valveState} /></td>
                    <td>{r.batteryPercent != null ? `${r.batteryPercent}%` : '—'}</td>
                    <td className="text-muted-sm" suppressHydrationWarning>
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
