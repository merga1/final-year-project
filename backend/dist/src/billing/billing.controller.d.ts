import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly service;
    constructor(service: BillingService);
    findAll(): Promise<import("./bill.entity").Bill[]>;
    getMobileBills(user: any): Promise<import("./bill.entity").Bill[]>;
}
