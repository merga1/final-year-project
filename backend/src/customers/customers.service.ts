import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

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
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  async create(data: Partial<Customer>) {
    const customer = this.repo.create({ ...data, email: data.email?.trim().toLowerCase() });
    return this.repo.save(customer);
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.findOne(id);
    await this.repo.update(id, { passwordHash });
  }

  async createFromAdmin(dto: CreateCustomerDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();

    const customer = this.repo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      name: fullName || 'Customer',
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      dateOfBirth: dto.dateOfBirth,
      address: dto.address,
      meterId: dto.meterId,
      zone: dto.zone || 'Zone A',
      accountStatus: 'active',
      role: 'customer',
    });

    return this.repo.save(customer);
  }

  async update(id: string, data: Partial<Customer>) {
    await this.findOne(id);
    if (data.firstName || data.lastName) {
      const existing = await this.findOne(id);
      const first = data.firstName ?? existing.firstName ?? '';
      const last = data.lastName ?? existing.lastName ?? '';
      data.name = `${first} ${last}`.trim();
    }
    if (data.email) data.email = data.email.trim().toLowerCase();
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
