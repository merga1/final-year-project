import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('valve_commands')
export class ValveCommand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  meterId: string;

  @Column()
  requestedState: 'OPEN' | 'CLOSED';

  @Column({ default: 'confirmed' })
  status: 'pending' | 'confirmed' | 'timeout' | 'failed';

  @Column({ nullable: true })
  confirmedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
