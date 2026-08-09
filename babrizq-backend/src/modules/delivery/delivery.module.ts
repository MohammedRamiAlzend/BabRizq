/**
 * Delivery module — the driver app's orders, status actions, and
 * proof-of-delivery uploads. Prisma and Storage are injected from their
 * global modules.
 */
import { Module } from '@nestjs/common';
import { DeliveryController } from './presentation/delivery.controller';
import { DeliveryService } from './application/delivery.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
