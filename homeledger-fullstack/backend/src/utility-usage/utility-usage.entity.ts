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

@Entity('utility_usage')
export class UtilityUsage {
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

  @Column({ type: 'varchar', length: 7 })
  month: string; // YYYY-MM

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @CreateDateColumn()
  createdAt: Date;
}