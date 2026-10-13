import { Module } from '@nestjs/common';

import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminUsersController, AdminAccountsController],
  providers: [AdminUsersService, AdminAccountsService],
})
export class AdminUsersModule {}
