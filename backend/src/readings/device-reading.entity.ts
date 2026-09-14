import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('device_readings')
export class DeviceReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column()
  meterId: string;

  @Column({ type: 'real', default: 0 })
  flowRateLpm: number;

  @Column({ type: 'real', default: 0 })
  totalUsageLiters: number;

  @Column({ type: 'real', default: 0 })
  turbidityNtu: number;

  @Column({ default: 'OPEN' })
  valveState: string;

  @Column({ default: 'ONLINE' })
  connectivity: string;

  @Column({ type: 'real', default: 100 })
  batteryPercent: number;

  @CreateDateColumn()
  timestamp: Date;
}
