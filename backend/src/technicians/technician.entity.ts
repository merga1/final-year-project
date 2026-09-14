import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type TechnicianStatus = 'on_duty' | 'off_duty' | 'on_leave';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'Zone A' })
  zone: string;

  @Column({ default: 'on_duty' })
  status: TechnicianStatus;

  @Column({ default: 0 })
  currentJobCount: number;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
