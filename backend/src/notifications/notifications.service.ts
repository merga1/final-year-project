import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationAudience } from './notification.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async onModuleInit() {
    try {
      // In Postgres environments where column names might differ (user_id vs userId)
      await this.repo.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'userId') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
                ALTER TABLE notifications ADD COLUMN "userId" varchar;
                UPDATE notifications SET "userId" = user_id WHERE "userId" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "userId" varchar;
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'relatedId') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_id') THEN
                ALTER TABLE notifications ADD COLUMN "relatedId" varchar;
                UPDATE notifications SET "relatedId" = related_id WHERE "relatedId" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "relatedId" varchar;
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'createdAt') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
                ALTER TABLE notifications ADD COLUMN "createdAt" timestamp DEFAULT now();
                UPDATE notifications SET "createdAt" = created_at WHERE "createdAt" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "createdAt" timestamp DEFAULT now();
              END IF;
            END IF;
          END IF;
        END $$;
      `);
    } catch {
      // Non-fatal, fallback works for SQLite or Postgres without DDL permissions
    }
  }

  async findForUser(userId: string, audience?: NotificationAudience) {
    try {
      return await this.repo.find({
        where: { userId, ...(audience ? { audience } : {}) },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    } catch {
      try {
        return await this.repo.query(
          `SELECT * FROM notifications WHERE (user_id = $1 OR "userId" = $1) ${audience ? 'AND audience = $2' : ''} ORDER BY id DESC LIMIT 100`,
          audience ? [userId, audience] : [userId],
        );
      } catch {
        return [];
      }
    }
  }

  async unreadCount(userId: string, audience?: NotificationAudience) {
    try {
      return await this.repo.count({
        where: { userId, read: false, ...(audience ? { audience } : {}) },
      });
    } catch {
      return 0;
    }
  }

  async create(data: Partial<Notification>) {
    try {
      return await this.repo.save(this.repo.create(data));
    } catch (err: any) {
      console.warn('NotificationsService.create default insert failed:', err?.message || err);
      try {
        // Fallback for Postgres if schema has snake_case column names
        const id = data.id || require('crypto').randomUUID();
        const userId = data.userId || (data as any).user_id || '';
        const audience = data.audience || 'customer';
        const type = data.type || 'general';
        const title = data.title || '';
        const message = data.message || '';
        const relatedId = data.relatedId || (data as any).related_id || null;
        await this.repo.query(
          `INSERT INTO notifications (id, user_id, audience, type, title, message, related_id, read)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false)
           ON CONFLICT DO NOTHING`,
          [id, userId, audience, type, title, message, relatedId],
        );
      } catch (fallbackErr: any) {
        console.warn('NotificationsService fallback insert also failed (non-fatal):', fallbackErr?.message || fallbackErr);
      }
      return null as any;
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
