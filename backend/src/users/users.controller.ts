import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import type { UserBudget, UserPreferences } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('settings')
  getSettings(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.usersService.getSettings(user.userId);
  }

  @Patch('settings')
  updateSettings(
    @Req() req: Request,
    @Body()
    body: {
      preferences?: UserPreferences | null;
      budgets?: UserBudget[];
    },
  ) {
    const user = req.user as { userId: number; email: string };
    return this.usersService.updateSettings(user.userId, body);
  }
}
