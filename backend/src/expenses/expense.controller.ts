import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Req() req: Request, @Body() createExpenseDto: CreateExpenseDto) {
    const user = req.user as { userId: number; email: string };
    return this.expenseService.create(user.userId, createExpenseDto);
  }

  @Get()
  findMyExpenses(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.expenseService.findAllByUser(user.userId);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: number; email: string };
    return this.expenseService.delete(user.userId, Number(id));
  }
}


