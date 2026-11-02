import { Repository } from 'typeorm';
import { Notification, NotificationAudience } from './notification.entity';
export declare class NotificationsService {
    private readonly repo;
    constructor(repo: Repository<Notification>);
    findForUser(userId: string, audience?: NotificationAudience): Promise<Notification[]>;
    unreadCount(userId: string, audience?: NotificationAudience): Promise<number>;
    create(data: Partial<Notification>): Promise<Notification>;
    markRead(id: string, userId: string): Promise<Notification>;
    markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
}
