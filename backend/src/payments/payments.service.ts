import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod } from './payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BillingService } from '../billing/billing.service';
import { CreateChapaPaymentDto, CreatePaymentDto } from './dto/payment.dto';

interface Payer {
  id: string;
  name: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    private readonly notifications: NotificationsService,
    private readonly billing: BillingService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  /**
   * Resolves the amount to charge. When a bill is referenced it must belong to
   * the payer and be unpaid, and the bill's own amount is used (never the client's).
   */
  private async resolveAmount(payer: Payer, dto: { billId?: string; amount?: number }) {
    if (dto.billId) {
      const bill = await this.billing.findOne(dto.billId);
      if (bill.customerId !== payer.id) throw new ForbiddenException('This bill belongs to another customer');
      if (bill.status === 'paid') throw new BadRequestException('This bill is already paid');
      return bill.amountEtb;
    }
    if (!dto.amount) throw new BadRequestException('Provide a billId or an amount');
    return dto.amount;
  }

  /** Customers can only create PENDING payments; verification is an admin/gateway action. */
  private async createPending(payer: Payer, dto: { billId?: string; amount?: number; reference?: string }, method: PaymentMethod) {
    const amount = await this.resolveAmount(payer, dto);
    return this.repo.save(
      this.repo.create({
        billId: dto.billId,
        customerId: payer.id,
        customerName: payer.name,
        amount,
        method,
        status: 'pending',
        reference: dto.reference ?? `${method.toUpperCase()}-${Date.now()}`,
      }),
    );
  }

  createForCustomer(payer: Payer, dto: CreatePaymentDto) {
    return this.createPending(payer, dto, dto.method ?? 'chapa');
  }

  async createChapaPayment(payer: Payer, dto: CreateChapaPaymentDto) {
    const payment = await this.createPending(payer, dto, 'chapa');
    await this.notifications.create({
      userId: payment.customerId,
      audience: 'customer',
      type: 'payment_pending',
      title: 'Payment started',
      message: `Your Chapa payment of ETB ${payment.amount.toFixed(2)} is pending confirmation.`,
      relatedId: payment.id,
    });
    const checkoutUrl = process.env.CHAPA_CHECKOUT_URL ?? null;
    return {
      payment,
      checkoutUrl,
      message: checkoutUrl
        ? 'Continue in the secure Chapa checkout.'
        : 'Chapa checkout is not configured in this environment. The payment was saved as pending.',
    };
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }
}
