import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { BillCategory } from '../bills/bill.entity';

export type Frequency = 'monthly' | 'quarterly';

@Entity('recurring_bills')
export class RecurringBill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  provider!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

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

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly'],
  })
  frequency!: Frequency;

  // ✅ FIXED: consistent string format (YYYY-MM-DD)
  @Column({ type: 'date' })
  startDate!: string;

  // ✅ FIXED: consistent string OR null (no Date type confusion)
  @Column({ type: 'date', nullable: true })
  lastGenerated!: string | null;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}