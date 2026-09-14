'use client';

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type DayUsage = { day: string; usageLiters: string };

function formatDay(day: string) {
  const d = new Date(day + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function UsageLineChart({ data }: { data: DayUsage[] }) {
  const chartData = data.map(d => ({
    day: formatDay(d.day),
    usage: parseFloat(parseFloat(d.usageLiters).toFixed(0)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" L" />
        <Tooltip formatter={(v: any) => [`${v} L`, 'Daily usage']} />
        <Line type="monotone" dataKey="usage" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UsageBarChart({ data }: { data: DayUsage[] }) {
  const chartData = data.map(d => ({
    day: formatDay(d.day),
    usage: parseFloat(parseFloat(d.usageLiters).toFixed(0)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" L" />
        <Tooltip formatter={(v: any) => [`${v} L`, 'Usage']} />
        <Legend />
        <Bar dataKey="usage" name="Daily Usage (L)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
