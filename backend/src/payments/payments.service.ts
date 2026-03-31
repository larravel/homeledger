import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from './payment.entity';
import { Bill } from '../bills/bill.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async payBill(userId: number, billId: number, dto: CreatePaymentDto) {
    const bill = await this.billRepository.findOne({
      where: { id: billId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.userId !== userId) {
      throw new ForbiddenException('You cannot pay this bill');
    }

    if (bill.status === 'paid') {
      throw new BadRequestException('This bill is already paid');
    }

    if (!dto.paymentDate) {
      throw new BadRequestException('Payment date is required');
    }

    const paymentDateObj = new Date(dto.paymentDate);
    const dueDateObj = new Date(bill.dueDate);

    if (isNaN(paymentDateObj.getTime())) {
      throw new BadRequestException('Invalid payment date');
    }

    const lateFee =
      paymentDateObj > dueDateObj ? Number(bill.amount) * 0.05 : 0;

    const amountPaid = Number(bill.amount) + lateFee;

    bill.status = 'paid';
    await this.billRepository.save(bill);

    const payment = this.paymentRepository.create({
      userId,
      billId: bill.id,
      paymentDate: dto.paymentDate,
      lateFee,
      amountPaid,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    return {
      message: 'Payment recorded successfully',
      payment: savedPayment,
    };
  }

  async findAllByUser(userId: number) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['bill'],
      order: { paymentDate: 'DESC' },
    });
  }
}