import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Alert, AlertType, AlertSeverity } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly repo: Repository<Alert>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findUnacknowledged() {
    return this.repo.find({ where: { acknowledged: false }, order: { createdAt: 'DESC' } });
  }

  findByMeterId(meterId: string) {
    return this.repo.find({ where: { meterId }, order: { createdAt: 'DESC' }, take: 20 });
  }

  count() {
    return this.repo.count();
  }

  countUnacknowledged() {
    return this.repo.countBy({ acknowledged: false });
  }

  countCriticalToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.repo.count({ where: { severity: 'critical', createdAt: MoreThan(today) } });
  }

  async acknowledge(id: string, adminName: string) {
    await this.repo.update(id, { acknowledged: true, acknowledgedBy: adminName });
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Alert>) {
    const alert = this.repo.create(data);
    return this.repo.save(alert);
  }

  /**
   * Creates an alert only if no alert of the same type+device was created
   * within the last 30 minutes (prevents spam).
   */
  async createIfNotRecent(
    meterId: string, deviceId: string,
    type: AlertType, message: string, severity: AlertSeverity,
  ) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await this.repo.findOne({
      where: { meterId, type, acknowledged: false },
      order: { createdAt: 'DESC' },
    });

    if (existing && existing.createdAt > thirtyMinutesAgo) {
      return null; // skip, too recent
    }

    return this.create({ meterId, deviceId, type, message, severity });
  }
}
