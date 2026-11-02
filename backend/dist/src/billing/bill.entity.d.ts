export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export declare class Bill {
    id: string;
    customerId: string;
    customerName: string;
    usageLiters: number;
    amountEtb: number;
    rate: number;
    status: BillStatus;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    createdAt: Date;
}
