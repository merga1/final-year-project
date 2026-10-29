import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type TicketPriority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'pending' | 'open' | 'assigned' | 'accepted' | 'in_progress' | 'resolved' | 'closed' | 'Pending';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ default: 'Customer' })
  customerName: string;

  @Column({ type: 'text', nullable: true })
  technicianId: string | null;

  @Column({ type: 'text', nullable: true })
  technicianName: string | null;

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

  @Column({ type: 'text', nullable: true })
  progressNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  statusHistory: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ type: 'datetime', nullable: true })
  assignedAt: Date | null;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
