import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  create(data: Partial<SupportTicket>) {
    const ticket = this.repo.create(data);
    return this.repo.save(ticket);
  }

  async update(id: string, data: Partial<SupportTicket>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }
}
