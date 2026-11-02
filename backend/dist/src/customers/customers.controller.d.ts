import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomersController {
    private readonly service;
    constructor(service: CustomersService);
    findAll(): Promise<import("./customer.entity").Customer[]>;
    findOne(id: string): Promise<import("./customer.entity").Customer>;
    create(body: CreateCustomerDto): Promise<import("./customer.entity").Customer>;
    update(id: string, body: any): Promise<import("./customer.entity").Customer>;
}
