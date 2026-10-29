import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    private readonly notifications: NotificationsService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  create(data: Partial<Payment>) {
    const payment = this.repo.create(data);
    return this.repo.save(payment);
  }

  async createChapaPayment(data: Partial<Payment>) {
    const payment = await this.repo.save(this.repo.create({
      ...data,
      method: 'chapa',
      status: 'pending',
      reference: data.reference ?? `CHAPA-${Date.now()}`,
    }));
    await this.notifications.create({
      userId: payment.customerId,
      audience: 'customer',
      type: 'payment_pending',
      title: 'Payment started',
      message: `Your Chapa payment of ETB ${payment.amount.toFixed(2)} is pending confirmation.`,
      relatedId: payment.id,
    });
    return {
      payment,
      checkoutUrl: process.env.CHAPA_CHECKOUT_URL ?? null,
      message: process.env.CHAPA_CHECKOUT_URL
        ? 'Continue in the secure Chapa checkout.'
        : 'Chapa checkout is not configured in this environment. The payment was saved as pending.',
    };
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }
}
