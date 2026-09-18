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

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  hireDate: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'No specialization' })
  specialization: string;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ default: 'Zone A' })
  zone: string;

  @Column({ default: 'on_duty' })
  status: TechnicianStatus;

  @Column({ default: 0 })
  currentJobCount: number;

  @Column({ default: 0 })
  completedRepairs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
