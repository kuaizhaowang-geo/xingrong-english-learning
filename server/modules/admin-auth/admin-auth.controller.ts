import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import type {
  AdminLoginResponse,
  AdminUser,
} from '@shared/api.interface';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('api/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AdminLoginResponse> {
    return this.adminAuthService.login(dto.username, dto.password);
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  async getMe(
    @Headers('x-admin-token') token: string,
  ): Promise<AdminUser> {
    const admin = await this.adminAuthService.validateToken(token);
    return admin as AdminUser;
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  async logout(
    @Headers('x-admin-token') token: string,
  ): Promise<{ success: boolean }> {
    const success = await this.adminAuthService.logout(token);
    return { success };
  }
}
