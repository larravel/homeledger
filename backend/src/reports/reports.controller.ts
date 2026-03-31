import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.reportsService.getDashboard(user.userId);
  }

  @Get('upcoming')
  getUpcomingBills(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.reportsService.getUpcomingBills(user.userId);
  }

  @Get('overdue')
  getOverdueBills(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.reportsService.getOverdueBills(user.userId);
  }
}