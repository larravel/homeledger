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

import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bills')
@UseGuards(JwtAuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(@Req() req: Request, @Body() createBillDto: CreateBillDto) {
    const user = req.user as { userId: number; email: string };
    return this.billsService.create(user.userId, createBillDto);
  }

  @Get()
  findMyBills(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.billsService.findAllByUser(user.userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { userId: number; email: string };
    return this.billsService.findOneByUser(user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBillDto,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.billsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { userId: number; email: string };
    return this.billsService.remove(user.userId, id);
  }
}