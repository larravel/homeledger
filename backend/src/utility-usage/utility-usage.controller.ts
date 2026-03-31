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

import { UtilityUsageService } from './utility-usage.service';
import { CreateUtilityUsageDto } from './dto/create-utility-usage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('utility-usage')
@UseGuards(JwtAuthGuard)
export class UtilityUsageController {
  constructor(private readonly utilityUsageService: UtilityUsageService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateUtilityUsageDto) {
    const user = req.user as { userId: number; email: string };
    return this.utilityUsageService.create(user.userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.utilityUsageService.findAllByUser(user.userId);
  }

  @Get('bill/:billId')
  findByBill(
    @Req() req: Request,
    @Param('billId', ParseIntPipe) billId: number,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.utilityUsageService.findByBill(user.userId, billId);
  }
}