import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type Connectivity = 'ONLINE' | 'OFFLINE' | 'WARNING';
export type ValveState = 'OPEN' | 'CLOSED';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  meterId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ default: 'Zone A' })
  zone: string;

  @Column({ default: 'ONLINE' })
  connectivity: Connectivity;

  @Column({ default: 'OPEN' })
  valveState: ValveState;

  @Column({ type: 'real', default: 100 })
  batteryPercent: number;

  @Column({ nullable: true })
  lastSeenAt: Date;

  /** GPS coordinates set by the technician on-site. */
  @Column({ type: 'real', nullable: true })
  latitude: number | null;

  @Column({ type: 'real', nullable: true })
  longitude: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
