import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export interface UserPreferences {
  currency: 'PHP' | 'USD' | 'EUR';
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  decimalPlaces: 0 | 2;
  emailNotifications: boolean;
  billReminders: boolean;
  expenseAlerts: boolean;
}

export interface UserBudget {
  category: string;
  limit: number;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences: UserPreferences | null;

  @Column({ type: 'simple-json', nullable: true })
  budgets: UserBudget[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
