/**
 * Orders module — checkout + order history for the customer app.
 */
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OffersModule } from '../offers/offers.module';
import { AccountingModule } from '../accounting/accounting.module';
import { OrdersController } from './presentation/orders.controller';
import { OrdersService } from './application/orders.service';
import { OrderNumberService } from './application/order-number.service';

@Module({
  imports: [NotificationsModule, OffersModule, AccountingModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderNumberService],
  exports: [OrdersService],
})
export class OrdersModule {}
