import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationAudience } from './notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  findForUser(userId: string, audience?: NotificationAudience) {
    return this.repo.find({
      where: { userId, ...(audience ? { audience } : {}) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  unreadCount(userId: string, audience?: NotificationAudience) {
    return this.repo.count({ where: { userId, read: false, ...(audience ? { audience } : {}) } });
  }

  /** A failed notification must never break the business action that triggered it, so errors are logged, not thrown. */
  async create(data: Partial<Notification>) {
    try {
      return await this.repo.save(this.repo.create(data));
    } catch (err: any) {
      this.logger.warn(`Could not save notification: ${err?.message ?? err}`);
      return null;
    }
  }

  async markRead(id: string, userId: string) {
    const notification = await this.repo.findOneBy({ id, userId });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, read: false }, { read: true });
    return { success: true };
  }
}
