import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from './customer.entity';
import { DevicesService } from '../devices/devices.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly devices: DevicesService,
  ) {}

  findAll() {
    return this.repo.find({ where: { role: Not('admin') }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async findByEmail(email: string) {
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  async findByMeterId(meterId: string) {
    return this.repo.findOneBy({ meterId: meterId.trim() });
  }

  async create(data: Partial<Customer>) {
    const customer = this.repo.create({ ...data, email: data.email?.trim().toLowerCase() });
    return this.repo.save(customer);
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.findOne(id);
    await this.repo.update(id, { passwordHash });
  }

  /** Used to roll back a pending self-registration if the request fails. */
  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
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
      meterId: dto.meterId?.trim() || undefined,
      zone: dto.zone || 'Zone A',
      accountStatus: 'active',
      role: 'customer',
    });

    return this.repo.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.findOne(id);
    const data: Partial<Customer> = { ...dto };
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const first = dto.firstName ?? existing.firstName ?? '';
      const last = dto.lastName ?? existing.lastName ?? '';
      data.name = `${first} ${last}`.trim() || existing.name;
    }
    if (dto.email) {
      data.email = dto.email.trim().toLowerCase();
      const taken = await this.findByEmail(data.email);
      if (taken && taken.id !== id) throw new ConflictException('Email already registered');
    }
    if (dto.meterId !== undefined) {
      const newMeterId = dto.meterId.trim();
      if (newMeterId) {
        const device = await this.devices.findByMeterId(newMeterId);
        if (!device) {
          throw new BadRequestException(
            `Water meter ${newMeterId} not found. Register the device first.`,
          );
        }
        const linked = await this.findByMeterId(newMeterId);
        if (linked && linked.id !== id) {
          throw new ConflictException('This water meter is already linked to another account');
        }
        if (existing.meterId && existing.meterId !== newMeterId) {
          await this.devices.unassignCustomer(existing.meterId);
        }
        await this.devices.updateByMeterId(newMeterId, { customerId: id });
        // Linking a meter is the admin's approval action.
        if (dto.accountStatus === undefined) data.accountStatus = 'active';
      } else if (existing.meterId) {
        await this.devices.unassignCustomer(existing.meterId);
      }
      data.meterId = newMeterId || undefined;
    }
    if (Object.keys(data).length) await this.repo.update(id, data);
    return this.findOne(id);
  }

  count() {
    return this.repo.count({ where: { role: Not('admin') } });
  }

  countByStatus(status: string) {
    return this.repo.countBy({ role: Not('admin'), accountStatus: status as any });
  }
}
