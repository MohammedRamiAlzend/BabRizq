/**
 * Store-owner module — products, categories, orders, and dashboard overview
 * for the authenticated store (via the X-Store-Id header).
 */
import { Module } from '@nestjs/common';
import { StoreController } from './presentation/store.controller';
import { StoreProductsService } from './application/store-products.service';
import { StoreCategoriesService } from './application/store-categories.service';
import { StoreOrdersService } from './application/store-orders.service';
import { StoreOverviewService } from './application/store-overview.service';

@Module({
  controllers: [StoreController],
  providers: [
    StoreProductsService,
    StoreCategoriesService,
    StoreOrdersService,
    StoreOverviewService,
  ],
})
export class StoreModule {}
