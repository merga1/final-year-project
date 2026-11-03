'use client';

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';

type DayUsage = { day: string; usageLiters: string };
type ZoneUsage = { zone: string; totalLiters: number; avgTurbidity: number; meterCount: number };
type QualityPoint = { day: string; avgTurbidity: number; maxTurbidity: number; avgFlowRate: number };

const ZONE_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

function formatDay(day: string) {
  if (!day) return '—';
  try {
    const raw = String(day).trim();
    // If it's pure YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }

    const cleanStr = raw.includes('T') ? raw : `${raw}T00:00:00Z`;
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }

    const direct = new Date(raw);
    if (!isNaN(direct.getTime())) {
      return direct.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return raw;
  } catch {
    return String(day);
  }
}

/** 1. Volumetric Usage Trend over 7 Days */
export function UsageLineChart({ data }: { data: DayUsage[] }) {
  const chartData = (data || []).map(d => ({
    day: formatDay(d.day),
    usage: Math.round(parseFloat(d.usageLiters || '0')),
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        No usage data available yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" L" width={75} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            formatter={(v: any) => [`${Number(v).toLocaleString()} L`, 'Daily Consumption']}
          />
          <Line
            type="monotone"
            dataKey="usage"
            name="Daily Volume (L)"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 2. Operational Zone Consumption Comparison (Zone A vs Zone B vs Zone C) */
export function ZoneDistributionBarChart({ data }: { data: ZoneUsage[] }) {
  const totalSystemLiters = (data || []).reduce((acc, z) => acc + Number(z.totalLiters || 0), 0);

  const chartData = (data || []).map(z => ({
    zone: z.zone || 'Unknown Zone',
    liters: Math.round(Number(z.totalLiters || 0)),
    percentage: totalSystemLiters > 0 ? Math.round((Number(z.totalLiters || 0) / totalSystemLiters) * 100) : 0,
    meters: z.meterCount || 1,
    avgTurbidity: z.avgTurbidity,
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        No zone distribution data available.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit=" L" />
          <YAxis dataKey="zone" type="category" tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 600 }} width={75} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
            formatter={(v: any, name: any, item: any) => [
              `${Number(v).toLocaleString()} L (${item.payload.percentage}% of system load)`,
              'Zone Volume',
            ]}
          />
          <Bar dataKey="liters" name="Total Volume" radius={[0, 6, 6, 0]} barSize={26}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 3. Water Quality (Turbidity NTU) & Flow Rate Trend */
export function WaterQualityChart({ data }: { data: QualityPoint[] }) {
  const chartData = (data || []).map(q => ({
    day: formatDay(q.day),
    turbidity: Number(q.avgTurbidity || 0),
    maxTurbidity: Number(q.maxTurbidity || 0),
    flowRate: Number(q.avgFlowRate || 0),
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        No water quality data recorded in this period.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis yAxisId="turb" tick={{ fontSize: 11, fill: '#d97706' }} unit=" NTU" width={65} domain={[0, 6]} />
          <YAxis yAxisId="flow" orientation="right" tick={{ fontSize: 11, fill: '#0891b2' }} unit=" L/m" width={60} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }} />
          <ReferenceLine yAxisId="turb" y={5.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'WHO Safe Limit (5 NTU)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          <Line yAxisId="turb" type="monotone" dataKey="turbidity" name="Avg Turbidity (NTU)" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
          <Line yAxisId="turb" type="monotone" dataKey="maxTurbidity" name="Peak Turbidity (NTU)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
          <Line yAxisId="flow" type="monotone" dataKey="flowRate" name="Avg Flow (L/min)" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
