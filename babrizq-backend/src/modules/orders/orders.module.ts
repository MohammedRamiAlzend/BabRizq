/**
 * Orders module — checkout + order history for the customer app.
 */
import { Module } from '@nestjs/common';
import { OrdersController } from './presentation/orders.controller';
import { OrdersService } from './application/orders.service';
import { OrderNumberService } from './application/order-number.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderNumberService],
  exports: [OrdersService],
})
export class OrdersModule {}
