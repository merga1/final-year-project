import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './bill.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Bill)
    private readonly repo: Repository<Bill>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  create(data: Partial<Bill>) {
    const bill = this.repo.create(data);
    return this.repo.save(bill);
  }

  count() {
    return this.repo.count();
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }

  async totalCollected(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('b')
      .select('SUM(b.amountEtb)', 'total')
      .where('b.status = :status', { status: 'paid' })
      .getRawOne();
    return Math.round(result?.total ?? 0);
  }

  async totalPending(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('b')
      .select('SUM(b.amountEtb)', 'total')
      .where('b.status != :status', { status: 'paid' })
      .getRawOne();
    return Math.round(result?.total ?? 0);
  }
}
