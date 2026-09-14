import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

  findByMeterId(meterId: string, limit = 50) {
    return this.repo.find({
      where: { meterId },
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

  findLatestByMeterId(meterId: string) {
    return this.repo.findOne({
      where: { meterId },
      order: { timestamp: 'DESC' },
    });
  }
}
