/**
 * Store-owner module — products, categories, orders, and dashboard overview
 * for the authenticated store (via the X-Store-Id header).
 */
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StoreController } from './presentation/store.controller';
import { StoreSettingsController } from './presentation/store-settings.controller';
import { StoreWarehouseController } from './presentation/store-warehouse.controller';
import { StoreProductsService } from './application/store-products.service';
import { StoreCategoriesService } from './application/store-categories.service';
import { StoreOrdersService } from './application/store-orders.service';
import { StoreOverviewService } from './application/store-overview.service';
import { StoreSettingsService } from './application/store-settings.service';
import { StoreWarehouseService } from './application/store-warehouse.service';

@Module({
  imports: [NotificationsModule],
  controllers: [StoreController, StoreSettingsController, StoreWarehouseController],
  providers: [
    StoreProductsService,
    StoreCategoriesService,
    StoreOrdersService,
    StoreOverviewService,
    StoreSettingsService,
    StoreWarehouseService,
  ],
})
export class StoreModule {}
