import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type AccountStatus = 'active' | 'suspended' | 'pending';

@Entity('customers')
export class Customer {
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

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  address: string;

  @Column({ unique: true, nullable: true })
  meterId: string;

  @Column({ default: 'Zone A' })
  zone: string;

  @Column({ default: 'customer' })
  role: string;

  @Column({ default: 'active' })
  accountStatus: AccountStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
