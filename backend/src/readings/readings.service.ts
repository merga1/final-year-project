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
      .select("date(r.timestamp)", 'day')
      .addSelect('MAX(r.totalUsageLiters) - MIN(r.totalUsageLiters)', 'usageLiters')
      .where('r.timestamp >= :since', { since: since.toISOString() });

    if (meterId) {
      qb.andWhere('r.meterId = :meterId', { meterId });
    }

    qb.groupBy('day').orderBy('day', 'ASC');
    return qb.getRawMany();
  }

  /** Returns total consumption grouped by distribution zone */
  async getZoneUsage() {
    const raw = await this.repo.query(`
      SELECT d.zone,
             ROUND(SUM(sub.usage), 0) as totalLiters,
             ROUND(AVG(sub.avgTurbidity), 2) as avgTurbidity,
             COUNT(DISTINCT d.meterId) as meterCount
      FROM devices d
      JOIN (
        SELECT meterId, (MAX(totalUsageLiters) - MIN(totalUsageLiters)) as usage, AVG(turbidityNtu) as avgTurbidity
        FROM device_readings
        GROUP BY meterId
      ) sub ON sub.meterId = d.meterId
      GROUP BY d.zone
      ORDER BY totalLiters DESC
    `);
    return raw;
  }

  /** Returns water quality (turbidity) and flow rate trend over time */
  async getQualityTrend() {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const raw = await this.repo.query(`
      SELECT date(timestamp) as day,
             ROUND(AVG(turbidityNtu), 2) as avgTurbidity,
             ROUND(MAX(turbidityNtu), 2) as maxTurbidity,
             ROUND(AVG(flowRateLpm), 1) as avgFlowRate
      FROM device_readings
      WHERE timestamp >= ?
      GROUP BY date(timestamp)
      ORDER BY day ASC
    `, [since.toISOString().slice(0, 10)]);
    return raw;
  }

  findLatestByMeterId(meterId: string) {
    return this.repo.findOne({
      where: { meterId },
      order: { timestamp: 'DESC' },
    });
  }
}
