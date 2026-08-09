/**
 * Cart module — server-side cart for the customer app.
 */
import { Module } from '@nestjs/common';
import { CartController } from './presentation/cart.controller';
import { CartService } from './application/cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
