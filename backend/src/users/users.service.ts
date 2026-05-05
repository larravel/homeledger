import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, type UserBudget, type UserPreferences } from './user.entity';
import { RecurringBill } from '../recurring-bills/recurring-bill.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RecurringBill)
    private recurringBillRepository: Repository<RecurringBill>,
  ) {}

  async create(name: string, email: string, password: string) {
    const user = this.userRepository.create({
      name,
      email,
      password,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async updatePassword(userId: number, hashedPassword: string) {
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    return this.userRepository.findOne({
      where: { id: userId },
    });
  }


  async findById(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async updateProfile(userId: number, name: string) {
    await this.userRepository.update(userId, {
      name,
    });

    return this.findById(userId);
  }

  async getSettings(userId: number) {
    const user = await this.findById(userId);

    return {
      preferences: user?.preferences ?? null,
      budgets: user?.budgets ?? [],
    };
  }

  async updateSettings(
    userId: number,
    settings: {
      preferences?: UserPreferences | null;
      budgets?: UserBudget[];
    },
  ) {
    const nextSettings: Partial<User> = {};

    if ('preferences' in settings) {
      nextSettings.preferences = settings.preferences ?? null;
    }

    if ('budgets' in settings) {
      nextSettings.budgets = settings.budgets ?? [];
    }

    if (Object.keys(nextSettings).length > 0) {
      await this.userRepository.update(userId, nextSettings);
    }

    return this.getSettings(userId);
  }

  async deleteAccount(userId: number) {
    await this.recurringBillRepository.delete({ userId });
    await this.userRepository.delete(userId);
  }
}
