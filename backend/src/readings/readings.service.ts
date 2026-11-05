import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReading } from './device-reading.entity';

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(DeviceReading)
    private readonly repo: Repository<DeviceReading>,
  ) {}

  create(data: Partial<DeviceReading>) {
    const reading = this.repo.create(data);
    return this.repo.save(reading);
  }

  findByMeterId(meterId?: string, limit = 50) {
    return this.repo.find({
      where: meterId ? { meterId } : {},
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /** Returns last 7 days of readings aggregated by day (for charts) */
  async getDailyUsage(meterId?: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const qb = this.repo.createQueryBuilder('r')
      .select("TO_CHAR(r.timestamp, 'YYYY-MM-DD')", 'day')
      .addSelect('ROUND(CAST(MAX(r.totalUsageLiters) - MIN(r.totalUsageLiters) AS numeric), 1)', 'usageLiters')
      .where('r.timestamp >= :since', { since: since.toISOString() });

    if (meterId) {
      qb.andWhere('r.meterId = :meterId', { meterId });
    }

    qb.groupBy("TO_CHAR(r.timestamp, 'YYYY-MM-DD')").orderBy('day', 'ASC');
    const raw = await qb.getRawMany();
    return raw;
  }

  /** Returns total consumption grouped by distribution zone */
  async getZoneUsage() {
    const raw = await this.repo.query(`
      SELECT d.zone,
             ROUND(CAST(SUM(sub.usage) AS numeric), 0) as "totalLiters",
             ROUND(CAST(AVG(sub."avgTurbidity") AS numeric), 2) as "avgTurbidity",
             COUNT(DISTINCT d."meterId") as "meterCount"
      FROM devices d
      JOIN (
        SELECT "meterId",
               (MAX("totalUsageLiters") - MIN("totalUsageLiters")) as usage,
               AVG("turbidityNtu") as "avgTurbidity"
        FROM device_readings
        GROUP BY "meterId"
      ) sub ON sub."meterId" = d."meterId"
      GROUP BY d.zone
      ORDER BY "totalLiters" DESC
    `);

    return (raw || []).map((r: any) => ({
      zone: r.zone || 'Unknown Zone',
      totalLiters: Number(r.totalLiters || 0),
      avgTurbidity: Number(r.avgTurbidity || 0),
      meterCount: Number(r.meterCount || 0),
    }));
  }

  /** Returns water quality (turbidity) and flow rate trend over time */
  async getQualityTrend() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const raw = await this.repo.query(`
      SELECT TO_CHAR("timestamp", 'YYYY-MM-DD') as day,
             ROUND(CAST(AVG("turbidityNtu") AS numeric), 2) as "avgTurbidity",
             ROUND(CAST(MAX("turbidityNtu") AS numeric), 2) as "maxTurbidity",
             ROUND(CAST(AVG("flowRateLpm") AS numeric), 1) as "avgFlowRate"
      FROM device_readings
      WHERE "timestamp" >= $1
      GROUP BY TO_CHAR("timestamp", 'YYYY-MM-DD')
      ORDER BY day ASC
    `, [since.toISOString()]);

    return (raw || []).map((r: any) => ({
      day: r.day,
      avgTurbidity: Number(r.avgTurbidity || 0),
      maxTurbidity: Number(r.maxTurbidity || 0),
      avgFlowRate: Number(r.avgFlowRate || 0),
    }));
  }

  findLatestByMeterId(meterId: string) {
    return this.repo.findOne({
      where: { meterId },
      order: { timestamp: 'DESC' },
    });
  }
}
