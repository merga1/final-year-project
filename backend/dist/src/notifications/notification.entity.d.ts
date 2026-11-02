export type NotificationAudience = 'customer' | 'technician' | 'admin';
export declare class Notification {
    id: string;
    userId: string;
    audience: NotificationAudience;
    type: string;
    title: string;
    message: string;
    relatedId: string;
    read: boolean;
    createdAt: Date;
}
