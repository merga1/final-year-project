import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type PaymentStatus = 'verified' | 'pending' | 'failed' | 'disputed';
export type PaymentMethod = 'chapa' | 'bank_transfer' | 'mobile_payment' | 'cash';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  billId: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ default: 'chapa' })
  method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
