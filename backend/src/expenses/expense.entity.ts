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

export type ExpenseCategory =
  | 'groceries'
  | 'rent'
  | 'utilities'
  | 'transportation'
  | 'entertainment'
  | 'healthcare'
  | 'dining'
  | 'shopping'
  | 'insurance'
  | 'education'
  | 'other';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: [
      'groceries',
      'rent',
      'utilities',
      'transportation',
      'entertainment',
      'healthcare',
      'dining',
      'shopping',
      'insurance',
      'education',
      'other',
    ],
  })
  category!: ExpenseCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
