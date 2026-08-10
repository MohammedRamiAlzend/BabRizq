/**
 * Warehouse module — the store owner's stock & purchasing back office
 * (`plans/03` P2): suppliers, purchase orders, FIFO valuation, stocktakes,
 * and low-stock alerts.
 *
 * `FifoCostService` is exported so checkout consumes FIFO layers at order
 * time (real COGS replaces the accounting P1 price proxy); `StockService`
 * is exported so other modules can evaluate low-stock flags atomically.
 */
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountingModule } from '../accounting/accounting.module';
import { WarehouseController } from './presentation/warehouse.controller';
import { FifoCostService } from './application/fifo-cost.service';
import { SuppliersService } from './application/suppliers.service';
import { PurchaseOrdersService } from './application/purchase-orders.service';
import { StockService } from './application/stock.service';

@Module({
  imports: [NotificationsModule, AccountingModule],
  controllers: [WarehouseController],
  providers: [
    FifoCostService,
    SuppliersService,
    PurchaseOrdersService,
    StockService,
  ],
  exports: [FifoCostService, StockService],
})
export class WarehouseModule {}
