import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bill, BillCategory } from '../bills/bill.entity';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { RecurringBill } from './recurring-bill.entity';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto';

const FREQUENCY_TO_MONTHS: Record<'monthly' | 'quarterly', number> = {
  monthly: 1,
  quarterly: 3,
};

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (dateString: string, months: number) => {
  const next = parseDate(dateString);
  next.setMonth(next.getMonth() + months);
  return formatDate(next);
};

@Injectable()
export class RecurringBillsService {
  constructor(
    @InjectRepository(RecurringBill)
    private repo: Repository<RecurringBill>,

    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async create(userId: number, data: CreateRecurringBillDto) {
    const recurringBill = this.repo.create({
      ...data,
      userId,
      lastGenerated: null,
    });

    return this.repo.save(recurringBill);
  }

  async findAll(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUser(userId: number, id: number) {
    const recurringBill = await this.repo.findOne({
      where: { id },
    });

    if (!recurringBill) {
      throw new NotFoundException('Recurring bill not found');
    }

    if (recurringBill.userId !== userId) {
      throw new ForbiddenException('You cannot access this recurring bill');
    }

    return recurringBill;
  }

  async update(userId: number, id: number, data: UpdateRecurringBillDto) {
    const recurringBill = await this.findOneByUser(userId, id);
    const previousStartDate = recurringBill.startDate;

    recurringBill.name = data.name ?? recurringBill.name;
    recurringBill.provider = data.provider ?? recurringBill.provider;
    recurringBill.amount = data.amount ?? recurringBill.amount;
    recurringBill.category =
      (data.category as BillCategory) ?? recurringBill.category;
    recurringBill.frequency = data.frequency ?? recurringBill.frequency;
    recurringBill.startDate = data.startDate ?? recurringBill.startDate;

    if (data.startDate && data.startDate !== previousStartDate) {
      recurringBill.lastGenerated = null;
    }

    return this.repo.save(recurringBill);
  }

  async delete(userId: number, id: number) {
    const recurringBill = await this.findOneByUser(userId, id);
    await this.repo.remove(recurringBill);

    return {
      message: 'Recurring bill deleted successfully',
    };
  }

  async generateBills(userId: number) {
    const recurringBills = await this.findAll(userId);
    const todayString = formatDate(new Date());
    let generatedCount = 0;

    for (const recurringBill of recurringBills) {
      let nextDueDate = recurringBill.lastGenerated
        ? addMonths(
            recurringBill.lastGenerated,
            FREQUENCY_TO_MONTHS[recurringBill.frequency],
          )
        : recurringBill.startDate;
      let latestGenerated = recurringBill.lastGenerated;

      while (parseDate(nextDueDate) <= parseDate(todayString)) {
        const existing = await this.billRepository.findOne({
          where: {
            name: recurringBill.name,
            provider: recurringBill.provider,
            dueDate: nextDueDate,
            userId,
            isRecurring: true,
          },
        });

        if (!existing) {
          await this.billRepository.save({
            name: recurringBill.name,
            provider: recurringBill.provider,
            amount: recurringBill.amount,
            dueDate: nextDueDate,
            category: recurringBill.category as BillCategory,
            userId: recurringBill.userId,
            isRecurring: true,
            frequency: recurringBill.frequency,
          });
          generatedCount += 1;
        }

        latestGenerated = nextDueDate;
        nextDueDate = addMonths(
          nextDueDate,
          FREQUENCY_TO_MONTHS[recurringBill.frequency],
        );
      }

      if (latestGenerated !== recurringBill.lastGenerated) {
        recurringBill.lastGenerated = latestGenerated;
        await this.repo.save(recurringBill);
      }
    }

    return {
      message:
        generatedCount > 0
          ? `Generated ${generatedCount} recurring bill${generatedCount === 1 ? '' : 's'}`
          : 'No recurring bills were due yet',
      generatedCount,
    };
  }

  async generateBillsForAllUsers() {
    const recurringBills = await this.repo.find({
      select: { userId: true },
    });
    const userIds = [...new Set(recurringBills.map((bill) => bill.userId))];

    let generatedCount = 0;

    for (const userId of userIds) {
      const result = await this.generateBills(userId);
      generatedCount += result.generatedCount;
    }

    return generatedCount;
  }
}
