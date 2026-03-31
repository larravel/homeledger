import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bill/:billId')
  payBill(
    @Req() req: Request,
    @Param('billId', ParseIntPipe) billId: number,
    @Body() dto: CreatePaymentDto,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.paymentsService.payBill(user.userId, billId, dto);
  }

  @Get()
  findMyPayments(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.paymentsService.findAllByUser(user.userId);
  }
}