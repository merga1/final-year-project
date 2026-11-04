import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Bill } from './bill.entity';
export declare const DEFAULT_GRACE_PERIOD_DAYS = 5;
export declare function calculateDueDate(periodEnd: Date | string, graceDays?: number): string;
export declare class BillingService implements OnModuleInit {
    private readonly repo;
    constructor(repo: Repository<Bill>);
    onModuleInit(): Promise<void>;
    findAll(): Promise<Bill[]>;
    findByCustomer(customerId: string): Promise<Bill[]>;
    findOne(id: string): Promise<Bill>;
    create(data: Partial<Bill>): Promise<Bill>;
    update(id: string, data: Partial<Bill>): Promise<Bill>;
    generateFromCumulativeReadings(params: {
        customerId: string;
        customerName: string;
        currentCumulativeLiters: number;
        previousCumulativeLiters: number;
        rate?: number;
        periodStart: string;
        periodEnd: string;
        graceDays?: number;
    }): Promise<Bill>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
    totalCollected(): Promise<number>;
    totalPending(): Promise<number>;
}
