import { Repository } from 'typeorm';
import { Bill } from './bill.entity';
export declare class BillingService {
    private readonly repo;
    constructor(repo: Repository<Bill>);
    findAll(): Promise<Bill[]>;
    findByCustomer(customerId: string): Promise<Bill[]>;
    create(data: Partial<Bill>): Promise<Bill>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
    totalCollected(): Promise<number>;
    totalPending(): Promise<number>;
}
