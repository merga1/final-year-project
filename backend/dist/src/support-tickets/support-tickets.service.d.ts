import { Repository } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TechniciansService } from '../technicians/technicians.service';
export declare class SupportTicketsService {
    private readonly repo;
    private readonly notifications;
    private readonly technicians;
    constructor(repo: Repository<SupportTicket>, notifications: NotificationsService, technicians: TechniciansService);
    findAll(): Promise<SupportTicket[]>;
    findOne(id: string): Promise<SupportTicket>;
    findByCustomer(customerId: string): Promise<SupportTicket[]>;
    findByTechnician(technicianId: string, status?: string): Promise<SupportTicket[]>;
    findOneForTechnician(id: string, technicianId: string): Promise<SupportTicket>;
    create(data: Partial<SupportTicket>): Promise<SupportTicket>;
    createAdminTicket(data: any): Promise<SupportTicket>;
    createCustomerTicket(data: Partial<SupportTicket>): Promise<SupportTicket>;
    update(id: string, data: Partial<SupportTicket>): Promise<SupportTicket | null>;
    transitionForTechnician(id: string, technicianId: string, data: {
        status: string;
        notes?: string;
        progressNotes?: string;
        rejectionReason?: string;
    }): Promise<SupportTicket>;
    private decrementWorkload;
    count(): Promise<number>;
    countOpen(): Promise<number>;
    countByStatus(status: string): Promise<number>;
}
