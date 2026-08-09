/**
 * Admin module — platform overview, user management, and platform settings
 * for the admin role app.
 */
import { Module } from '@nestjs/common';
import { AdminController } from './presentation/admin.controller';
import { AdminUsersService } from './application/admin-users.service';
import { AdminSettingsService } from './application/admin-settings.service';
import { AdminOverviewService } from './application/admin-overview.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminUsersService,
    AdminSettingsService,
    AdminOverviewService,
  ],
})
export class AdminModule {}
