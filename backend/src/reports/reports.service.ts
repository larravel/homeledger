import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { Bill } from '../bills/bill.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async getDashboard(userId: number) {
    const today = new Date();

    // ✅ GET ALL BILLS (no month filter)
    const bills = await this.billRepository.find({
      where: { userId },
    });

    const totalBillsThisMonth = bills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0,
    );

    const totalPaid = bills
      .filter((bill) => bill.status === 'paid')
      .reduce((sum, bill) => sum + Number(bill.amount), 0);

    const totalUnpaid = bills
      .filter((bill) => bill.status !== 'paid')
      .reduce((sum, bill) => sum + Number(bill.amount), 0);

    // ✅ Upcoming = all unpaid in the future
    const upcomingBills = bills.filter(
      (bill) =>
        bill.status !== 'paid' &&
        new Date(bill.dueDate) > today,
    );

    const upcomingDueTotal = upcomingBills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0,
    );

    // ✅ Overdue = unpaid + past due date
    const overdueCount = bills.filter(
      (bill) =>
        bill.status !== 'paid' &&
        new Date(bill.dueDate) < today,
    ).length;

    // ✅ Category breakdown (ALL bills)
    const categories = ['utility', 'rent', 'subscription', 'loan', 'insurance'];

    const categoryBreakdown = categories.map((category) => {
      const total = bills
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
    const today = new Date();

    const bills = await this.billRepository.find({
      where: { userId },
    });

    return bills
      .filter(
        (bill) =>
          bill.status !== 'paid' &&
          new Date(bill.dueDate) > today,
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime(),
      );
  }

  async getOverdueBills(userId: number) {
    const today = new Date();

    const bills = await this.billRepository.find({
      where: { userId },
    });

    return bills
      .filter(
        (bill) =>
          bill.status !== 'paid' &&
          new Date(bill.dueDate) < today,
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime(),
      );
  }
}