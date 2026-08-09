/**
 * Offers module — store promotions CRUD + the checkout discount engine.
 *
 * `OffersService` is exported so the orders module can apply the best active
 * offer at checkout (and later the storefront can expose discounted prices).
 */
import { Module } from '@nestjs/common';
import { OffersController } from './presentation/offers.controller';
import { OffersService } from './application/offers.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
