import { SupportTicketsService } from './support-tickets.service';
export declare class SupportTicketsController {
    private readonly service;
    constructor(service: SupportTicketsService);
    findAll(): Promise<import("./support-ticket.entity").SupportTicket[]>;
    findOne(id: string): Promise<import("./support-ticket.entity").SupportTicket>;
    update(id: string, body: any): Promise<import("./support-ticket.entity").SupportTicket | null>;
    getMobileTickets(user: any): Promise<import("./support-ticket.entity").SupportTicket[]>;
    createTicket(user: any, body: any): Promise<import("./support-ticket.entity").SupportTicket>;
    getCustomerTicket(user: any, id: string): Promise<import("./support-ticket.entity").SupportTicket>;
    getTechnicianTickets(user: any, status?: string): Promise<import("./support-ticket.entity").SupportTicket[]>;
    getTechnicianTicket(user: any, id: string): Promise<import("./support-ticket.entity").SupportTicket>;
    updateTechnicianTicket(user: any, id: string, body: any): Promise<import("./support-ticket.entity").SupportTicket>;
}
