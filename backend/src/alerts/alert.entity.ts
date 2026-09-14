import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'WATER_QUALITY' | 'HIGH_USAGE' | 'DEVICE_OFFLINE' | 'VALVE_FAULT' | 'LOW_BATTERY';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column()
  meterId: string;

  @Column()
  type: AlertType;

  @Column()
  message: string;

  @Column({ default: 'warning' })
  severity: AlertSeverity;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
