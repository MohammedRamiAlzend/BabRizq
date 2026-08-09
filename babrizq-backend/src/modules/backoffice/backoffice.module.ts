/**
 * Back-office module — platform order management, driver roster, dashboard.
 */
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BackofficeController } from './presentation/backoffice.controller';
import { BackofficeOrdersService } from './application/backoffice-orders.service';
import { BackofficeDriversService } from './application/backoffice-drivers.service';
import { BackofficeOverviewService } from './application/backoffice-overview.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BackofficeController],
  providers: [
    BackofficeOrdersService,
    BackofficeDriversService,
    BackofficeOverviewService,
  ],
})
export class BackofficeModule {}
