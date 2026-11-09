import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './bill.entity';
import { UpdateBillDto } from './dto/update-bill.dto';

export const DEFAULT_GRACE_PERIOD_DAYS = 5;

export function calculateDueDate(periodEnd: Date | string, graceDays = DEFAULT_GRACE_PERIOD_DAYS): string {
  const d = new Date(periodEnd);
  d.setDate(d.getDate() + graceDays);
  return d.toISOString();
}

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

  async findOne(id: string) {
    const bill = await this.repo.findOneBy({ id });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  create(data: Partial<Bill>) {
    const bill = this.repo.create(data);
    return this.repo.save(bill);
  }

  async update(id: string, data: UpdateBillDto) {
    await this.findOne(id);
    if (Object.keys(data).length) await this.repo.update(id, data);
    return this.findOne(id);
  }

  /**
   * Generates bill from cumulative meter readings:
   * Net Consumption (Liters) = Current Cumulative Reading - Previous Period Cumulative Reading
   * Amount (ETB) = Net Consumption * Tariff Rate / 100  (rate = ETB per 100 liters)
   * Not yet called by a route or scheduler: it is the building block for the monthly billing job.
   * Due Date = Period End + 5 Days Grace Period
   */
  async generateFromCumulativeReadings(params: {
    customerId: string;
    customerName: string;
    currentCumulativeLiters: number;
    previousCumulativeLiters: number;
    rate?: number;
    periodStart: string;
    periodEnd: string;
    graceDays?: number;
  }) {
    const netUsageLiters = Math.max(0, params.currentCumulativeLiters - params.previousCumulativeLiters);
    const rate = params.rate ?? 5;
    const amountEtb = Math.round((netUsageLiters * rate) / 100);
    const dueDate = calculateDueDate(params.periodEnd, params.graceDays ?? DEFAULT_GRACE_PERIOD_DAYS);

    return this.create({
      customerId: params.customerId,
      customerName: params.customerName,
      usageLiters: netUsageLiters,
      amountEtb,
      rate,
      status: 'pending',
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      dueDate,
    });
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
    return Math.round(Number(result?.total ?? 0));
  }

  async totalPending(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('b')
      .select('SUM(b.amountEtb)', 'total')
      .where('b.status != :status', { status: 'paid' })
      .getRawOne();
    return Math.round(Number(result?.total ?? 0));
  }
}
