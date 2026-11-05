import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification, NotificationAudience } from './notification.entity';
export declare class NotificationsService implements OnModuleInit {
    private readonly repo;
    constructor(repo: Repository<Notification>);
    onModuleInit(): Promise<void>;
    findForUser(userId: string, audience?: NotificationAudience): Promise<any>;
    unreadCount(userId: string, audience?: NotificationAudience): Promise<number>;
    create(data: Partial<Notification>): Promise<any>;
    markRead(id: string, userId: string): Promise<Notification>;
    markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
}
