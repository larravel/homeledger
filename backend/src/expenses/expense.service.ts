import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    const expense = this.expenseRepository.create({
      userId,
      category: createExpenseDto.category,
      amount: createExpenseDto.amount,
      date: createExpenseDto.date,
      description: createExpenseDto.description || null,
    });

    return this.expenseRepository.save(expense);
  }

  async findAllByUser(userId: number) {
    return this.expenseRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async delete(userId: number, expenseId: number) {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId, userId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    await this.expenseRepository.remove(expense);
    return { message: 'Expense deleted successfully' };
  }
}

