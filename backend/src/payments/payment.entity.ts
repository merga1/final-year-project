import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type PaymentStatus = 'verified' | 'pending' | 'failed' | 'disputed';
export type PaymentMethod = 'chappa' | 'bank_transfer' | 'mobile_payment' | 'cash';

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

  @Column({ default: 'chappa' })
  method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
