export type TicketPriority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'pending' | 'open' | 'assigned' | 'accepted' | 'in_progress' | 'resolved' | 'closed' | 'Pending';
export declare class SupportTicket {
    id: string;
    customerId: string;
    customerName: string;
    technicianId: string | null;
    technicianName: string | null;
    type: string;
    issue: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    notes: string;
    progressNotes: string;
    rejectionReason: string;
    statusHistory: string;
    customerAddress: string;
    deviceId: string;
    assignedAt: Date | null;
    acceptedAt: Date;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
