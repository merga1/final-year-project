import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DeviceReading } from './device-reading.entity';
import { Device } from '../devices/device.entity';

const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);
const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

/**
 * Aggregations are done in TypeScript on purpose: the same code then works on
 * both SQLite (local) and PostgreSQL (production) without dialect-specific SQL.
 */
@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(DeviceReading)
    private readonly repo: Repository<DeviceReading>,
  ) {}

  create(data: Partial<DeviceReading>) {
    return this.repo.save(this.repo.create(data));
  }

  findByMeterId(meterId?: string, limit = 50) {
    return this.repo.find({
      where: meterId ? { meterId } : {},
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  findLatestByMeterId(meterId: string) {
    return this.repo.findOne({ where: { meterId }, order: { timestamp: 'DESC' } });
  }

  private since(date: Date, meterId?: string) {
    return this.repo.find({
      where: { timestamp: MoreThanOrEqual(date), ...(meterId ? { meterId } : {}) },
      order: { timestamp: 'ASC' },
    });
  }

  /** Liters consumed by one meter since `date` (cumulative counter: last - first). */
  async usageSince(meterId: string, date: Date): Promise<number> {
    const rows = await this.since(date, meterId);
    if (rows.length < 2) return 0;
    return Math.max(0, round(rows[rows.length - 1].totalUsageLiters - rows[0].totalUsageLiters));
  }

  /** Last 7 days: liters per day (sum of each meter's daily consumption), for charts. */
  async getDailyUsage(meterId?: string) {
    const rows = await this.since(daysAgo(7), meterId);
    const perMeterDay = new Map<string, { min: number; max: number }>();
    for (const r of rows) {
      const key = `${dayKey(r.timestamp)}|${r.meterId}`;
      const cur = perMeterDay.get(key);
      if (!cur) perMeterDay.set(key, { min: r.totalUsageLiters, max: r.totalUsageLiters });
      else {
        cur.min = Math.min(cur.min, r.totalUsageLiters);
        cur.max = Math.max(cur.max, r.totalUsageLiters);
      }
    }
    const perDay = new Map<string, number>();
    for (const [key, v] of perMeterDay) {
      const day = key.split('|')[0];
      perDay.set(day, (perDay.get(day) ?? 0) + (v.max - v.min));
    }
    return [...perDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, liters]) => ({ day, usageLiters: round(liters) }));
  }

  /** Last 30 days of consumption and average turbidity grouped by distribution zone. */
  async getZoneUsage() {
    const [rows, devices] = await Promise.all([
      this.since(daysAgo(30)),
      this.repo.manager.getRepository(Device).find(),
    ]);
    const zoneOf = new Map<string, string>(devices.map((d) => [d.meterId, d.zone] as [string, string]));
    const perMeter = new Map<string, { min: number; max: number; turbiditySum: number; count: number }>();
    for (const r of rows) {
      const cur = perMeter.get(r.meterId);
      if (!cur) {
        perMeter.set(r.meterId, { min: r.totalUsageLiters, max: r.totalUsageLiters, turbiditySum: r.turbidityNtu, count: 1 });
      } else {
        cur.min = Math.min(cur.min, r.totalUsageLiters);
        cur.max = Math.max(cur.max, r.totalUsageLiters);
        cur.turbiditySum += r.turbidityNtu;
        cur.count += 1;
      }
    }
    const zones = new Map<string, { liters: number; turbidity: number; meters: number }>();
    for (const [meterId, v] of perMeter) {
      const zone = zoneOf.get(meterId);
      if (!zone) continue;
      const z = zones.get(zone) ?? { liters: 0, turbidity: 0, meters: 0 };
      z.liters += v.max - v.min;
      z.turbidity += v.turbiditySum / v.count;
      z.meters += 1;
      zones.set(zone, z);
    }
    return [...zones.entries()]
      .map(([zone, z]) => ({
        zone,
        totalLiters: Math.round(z.liters),
        avgTurbidity: round(z.turbidity / z.meters, 2),
        meterCount: z.meters,
      }))
      .sort((a, b) => b.totalLiters - a.totalLiters);
  }

  /** Last 7 days: turbidity and flow-rate trend per day. */
  async getQualityTrend() {
    const rows = await this.since(daysAgo(7));
    const days = new Map<string, { t: number; maxT: number; f: number; n: number }>();
    for (const r of rows) {
      const key = dayKey(r.timestamp);
      const d = days.get(key) ?? { t: 0, maxT: 0, f: 0, n: 0 };
      d.t += r.turbidityNtu;
      d.f += r.flowRateLpm;
      d.maxT = Math.max(d.maxT, r.turbidityNtu);
      d.n += 1;
      days.set(key, d);
    }
    return [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => ({
        day,
        avgTurbidity: round(d.t / d.n, 2),
        maxTurbidity: round(d.maxT, 2),
        avgFlowRate: round(d.f / d.n, 1),
      }));
  }
}
