import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Admin' })
  actor: string;

  @Column()
  action: string;

  @Column({ default: 'GENERAL' })
  category: string;

  @Column()
  targetEntity: string;

  @Column({ type: 'text' })
  details: string;

  @Column({ default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED' | 'WARNING';

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
