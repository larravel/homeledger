import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UtilityUsage } from './utility-usage.entity';
import { Bill } from '../bills/bill.entity';
import { CreateUtilityUsageDto } from './dto/create-utility-usage.dto';

@Injectable()
export class UtilityUsageService {
  constructor(
    @InjectRepository(UtilityUsage)
    private utilityUsageRepository: Repository<UtilityUsage>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async create(userId: number, dto: CreateUtilityUsageDto) {
    const bill = await this.billRepository.findOne({
      where: { id: dto.billId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.userId !== userId) {
      throw new ForbiddenException('You cannot add usage to this bill');
    }

    if (bill.category !== 'utility') {
      throw new ForbiddenException('Usage can only be recorded for utility bills');
    }

    const existing = await this.utilityUsageRepository.findOne({
      where: {
        userId,
        billId: dto.billId,
        month: dto.month,
      },
    });

    if (existing) {
      existing.value = dto.value;
      existing.unit = dto.unit;
      return this.utilityUsageRepository.save(existing);
    }

    const usage = this.utilityUsageRepository.create({
      userId,
      billId: dto.billId,
      month: dto.month,
      value: dto.value,
      unit: dto.unit,
    });

    return this.utilityUsageRepository.save(usage);
  }

  async findAllByUser(userId: number) {
    return this.utilityUsageRepository.find({
      where: { userId },
      relations: ['bill'],
      order: {
        month: 'ASC',
      },
    });
  }

  async findByBill(userId: number, billId: number) {
    return this.utilityUsageRepository.find({
      where: {
        userId,
        billId,
      },
      relations: ['bill'],
      order: {
        month: 'ASC',
      },
    });
  }
}