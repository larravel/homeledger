import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    const foundUser = await this.authService.getUserById(user.userId);

    if (!foundUser) {
      throw new Error('User not found');
    }

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: Request,
    @Body() body: { name: string },
  ) {
    const user = req.user as { userId: number; email: string };
    return this.authService.updateProfile(user.userId, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };

    const foundUser = await this.authService.getUserById(user.userId);

    if (!foundUser) {
      throw new Error('User not found');
    }

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = req.user as { userId: number; email: string };

    return this.authService.changePassword(
      user.userId,
      changePasswordDto.current,
      changePasswordDto.new,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  deleteAccount(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.authService.deleteAccount(user.userId);
  }
}
