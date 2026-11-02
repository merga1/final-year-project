import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsService {
    private readonly repo;
    private readonly notifications;
    constructor(repo: Repository<Payment>, notifications: NotificationsService);
    findAll(): Promise<Payment[]>;
    findByCustomer(customerId: string): Promise<Payment[]>;
    create(data: Partial<Payment>): Promise<Payment>;
    createChapaPayment(data: Partial<Payment>): Promise<{
        payment: Payment;
        checkoutUrl: string | null;
        message: string;
    }>;
    countByStatus(status: string): Promise<number>;
}
