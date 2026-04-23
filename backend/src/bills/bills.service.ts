import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Bill } from './bill.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async create(userId: number, createBillDto: CreateBillDto) {
    const bill = this.billRepository.create({
      userId,
      name: createBillDto.name,
      provider: createBillDto.provider,
      amount: createBillDto.amount,
      dueDate: createBillDto.dueDate,
      category: createBillDto.category,
      status: 'unpaid',
      isRecurring: createBillDto.isRecurring ?? false,
      frequency: createBillDto.isRecurring
        ? createBillDto.frequency ?? 'monthly'
        : null,
      recurringGroupId: createBillDto.isRecurring ? randomUUID() : null,
    });

    return this.billRepository.save(bill);
  }

  async findAllByUser(userId: number) {
    return this.billRepository.find({
      where: { userId },
      order: { dueDate: 'ASC' },
    });
  }

  async findOneByUser(userId: number, id: number) {
    const bill = await this.billRepository.findOne({
      where: { id },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.userId !== userId) {
      throw new ForbiddenException('You cannot access this bill');
    }

    return bill;
  }

  async update(userId: number, id: number, dto: UpdateBillDto) {
    const bill = await this.findOneByUser(userId, id);

    bill.name = dto.name ?? bill.name;
    bill.provider = dto.provider ?? bill.provider;
    bill.amount = dto.amount ?? bill.amount;
    bill.dueDate = dto.dueDate ?? bill.dueDate;
    bill.status = dto.status ?? bill.status;
    bill.category = (dto.category as any) ?? bill.category;

    if (dto.isRecurring !== undefined) {
      bill.isRecurring = dto.isRecurring;
      bill.frequency = dto.isRecurring ? dto.frequency ?? bill.frequency ?? 'monthly' : null;
      bill.recurringGroupId = dto.isRecurring
        ? bill.recurringGroupId ?? randomUUID()
        : null;
    } else if (dto.frequency) {
      bill.frequency = dto.frequency;
    }

    return this.billRepository.save(bill);
  }

  async remove(userId: number, id: number) {
    const bill = await this.findOneByUser(userId, id);
    await this.billRepository.remove(bill);

    return {
      message: 'Bill deleted successfully',
    };
  }
}