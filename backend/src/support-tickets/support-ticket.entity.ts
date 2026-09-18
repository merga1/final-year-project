import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type TicketPriority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'Pending';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ default: 'Customer' })
  customerName: string;

  @Column({ nullable: true })
  technicianId: string;

  @Column({ nullable: true })
  technicianName: string;

  @Column({ default: 'SENSOR' })
  type: string;

  @Column({ default: 'General support' })
  issue: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'Medium' })
  priority: TicketPriority;

  @Column({ default: 'open' })
  status: TicketStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
