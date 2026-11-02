export type PaymentStatus = 'verified' | 'pending' | 'failed' | 'disputed';
export type PaymentMethod = 'chapa' | 'chappa' | 'bank_transfer' | 'mobile_payment' | 'cash';
export declare class Payment {
    id: string;
    billId: string;
    customerId: string;
    customerName: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    status: PaymentStatus;
    createdAt: Date;
}
