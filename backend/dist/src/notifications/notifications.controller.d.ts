import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    list(user: any): Promise<{
        items: import("./notification.entity").Notification[];
        unread: number;
    }>;
    markRead(user: any, id: string): Promise<import("./notification.entity").Notification>;
    markAllRead(user: any): Promise<{
        success: boolean;
    }>;
}
