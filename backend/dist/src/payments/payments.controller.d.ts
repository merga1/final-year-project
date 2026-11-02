import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly service;
    constructor(service: PaymentsService);
    findAll(): Promise<import("./payment.entity").Payment[]>;
    createPayment(user: any, body: any): Promise<import("./payment.entity").Payment>;
    getMobilePayments(user: any): Promise<import("./payment.entity").Payment[]>;
    createChapaPayment(user: any, body: any): Promise<{
        payment: import("./payment.entity").Payment;
        checkoutUrl: string | null;
        message: string;
    }>;
}
