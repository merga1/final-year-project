import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationAudience } from './notification.entity';

@Injectable()
export class NotificationsService {
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
    return this.repo.count({
      where: { userId, read: false, ...(audience ? { audience } : {}) },
    });
  }

  create(data: Partial<Notification>) {
    return this.repo.save(this.repo.create(data));
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
