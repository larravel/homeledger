import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Bill } from '../bills/bill.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  billId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Bill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billId' })
  bill: Bill;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lateFee: number;

  @CreateDateColumn()
  createdAt: Date;
}