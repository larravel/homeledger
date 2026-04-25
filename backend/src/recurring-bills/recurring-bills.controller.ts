import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto';
import { RecurringBillsService } from './recurring-bills.service';

@Controller('recurring-bills')
@UseGuards(JwtAuthGuard)
export class RecurringBillsController {
  constructor(private readonly service: RecurringBillsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateRecurringBillDto) {
    const user = req.user as { userId: number; email: string };
    return this.service.create(user.userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.service.findAll(user.userId);
  }

  @Post('generate')
  generateBills(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.service.generateBills(user.userId);
  }

  @Get('generate')
  generateBillsLegacy(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.service.generateBills(user.userId);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecurringBillDto,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { userId: number; email: string };
    return this.service.delete(user.userId, id);
  }
}
