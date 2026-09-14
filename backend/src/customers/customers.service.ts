import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  async create(data: Partial<Customer>) {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async update(id: string, data: Partial<Customer>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  count() {
    return this.repo.count();
  }

  countByStatus(status: string) {
    return this.repo.countBy({ accountStatus: status as any });
  }
}
