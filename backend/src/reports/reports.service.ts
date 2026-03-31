import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThanOrEqual, Repository } from 'typeorm';

import { Bill } from '../bills/bill.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  private getMonthRange(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  private getNext7Days(date = new Date()) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 7);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  async getDashboard(userId: number) {
    const { start, end } = this.getMonthRange();
    const today = new Date().toISOString().split('T')[0];
    const next7 = this.getNext7Days();

    const monthBills = await this.billRepository.find({
      where: {
        userId,
        dueDate: Between(start, end),
      },
    });

    const totalBillsThisMonth = monthBills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0,
    );

    const totalPaid = monthBills
      .filter((bill) => bill.status === 'paid')
      .reduce((sum, bill) => sum + Number(bill.amount), 0);

    const totalUnpaid = monthBills
      .filter((bill) => bill.status !== 'paid')
      .reduce((sum, bill) => sum + Number(bill.amount), 0);

    const upcomingBills = await this.billRepository.find({
      where: {
        userId,
        status: 'unpaid',
        dueDate: Between(next7.start, next7.end),
      },
    });

    const upcomingDueTotal = upcomingBills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0,
    );

    const overdueCount = await this.billRepository.count({
      where: {
        userId,
        status: 'overdue',
        dueDate: LessThan(today),
      },
    });

    const categories = ['utility', 'rent', 'subscription', 'loan', 'insurance'];

    const categoryBreakdown = categories.map((category) => {
      const total = monthBills
        .filter((bill) => bill.category === category)
        .reduce((sum, bill) => sum + Number(bill.amount), 0);

      return {
        category,
        total,
      };
    });

    return {
      totalBillsThisMonth,
      totalPaid,
      totalUnpaid,
      upcomingDueTotal,
      overdueCount,
      categoryBreakdown,
    };
  }

  async getUpcomingBills(userId: number) {
    const next7 = this.getNext7Days();

    return this.billRepository.find({
      where: {
        userId,
        status: 'unpaid',
        dueDate: Between(next7.start, next7.end),
      },
      order: {
        dueDate: 'ASC',
      },
    });
  }

  async getOverdueBills(userId: number) {
    const today = new Date().toISOString().split('T')[0];

    return this.billRepository.find({
      where: {
        userId,
        status: 'overdue',
        dueDate: LessThan(today),
      },
      order: {
        dueDate: 'ASC',
      },
    });
  }
}