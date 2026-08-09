/**
 * Notifications module — the shared in-app notification rail.
 *
 * `NotificationsService` is exported so every domain module (orders, store,
 * backoffice, delivery, marketer) can create notifications atomically with
 * their own transactions.
 */
import { Module } from '@nestjs/common';
import { NotificationsController } from './presentation/notifications.controller';
import { NotificationsService } from './application/notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
