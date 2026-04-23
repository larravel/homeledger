import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type BillStatus = 'paid' | 'unpaid' | 'overdue';

export type BillCategory =
  | 'utility'
  | 'rent'
  | 'subscription'
  | 'loan'
  | 'insurance'
  | 'transportation'
  | 'healthcare'
  | 'education';

export type BillFrequency = 'monthly' | 'quarterly';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({
    type: 'enum',
    enum: ['paid', 'unpaid', 'overdue'],
    default: 'unpaid',
  })
  status!: BillStatus;

  @Column({
    type: 'enum',
    enum: [
      'utility',
      'rent',
      'subscription',
      'loan',
      'insurance',
      'transportation',
      'healthcare',
      'education',
    ],
  })
  category!: BillCategory;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly'],
    nullable: true,
  })
  frequency!: BillFrequency | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurringGroupId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}