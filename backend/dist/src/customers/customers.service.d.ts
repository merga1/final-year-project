import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersService {
    private readonly repo;
    constructor(repo: Repository<Customer>);
    findAll(): Promise<Customer[]>;
    findOne(id: string): Promise<Customer>;
    findByEmail(email: string): Promise<Customer | null>;
    create(data: Partial<Customer>): Promise<Customer>;
    updatePasswordHash(id: string, passwordHash: string): Promise<void>;
    createFromAdmin(dto: CreateCustomerDto): Promise<Customer>;
    update(id: string, data: Partial<Customer>): Promise<Customer>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
}
