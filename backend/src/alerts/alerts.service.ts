import { Injectable, NotFoundException } from '@nestjs/common';
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

  countOpenCritical() {
    return this.repo.count({ where: { severity: 'critical', acknowledged: false } });
  }

  async acknowledge(id: string, adminName: string) {
    const alert = await this.repo.findOneBy({ id });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    await this.repo.update(id, { acknowledged: true, acknowledgedBy: adminName });
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Alert>) {
    const alert = this.repo.create(data);
    return this.repo.save(alert);
  }

  /**
   * Creates an alert unless an unacknowledged alert of the same type for this
   * meter was already raised in the last 30 minutes (prevents alert spam).
   * Returns the new alert, or null when skipped.
   */
  async createIfNotRecent(
    meterId: string, deviceId: string,
    type: AlertType, message: string, severity: AlertSeverity,
  ) {
    const recent = await this.repo.findOne({
      where: {
        meterId,
        type,
        acknowledged: false,
        createdAt: MoreThan(new Date(Date.now() - 30 * 60 * 1000)),
      },
    });
    if (recent) return null;
    return this.create({ meterId, deviceId, type, message, severity });
  }
}
