import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column({ type: 'real' })
  usageLiters: number;

  @Column({ type: 'real' })
  amountEtb: number;

  @Column({ default: 'pending' })
  status: BillStatus;

  @Column({ type: 'text' })
  periodStart: string;

  @Column({ type: 'text' })
  periodEnd: string;

  @Column({ type: 'text' })
  dueDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
