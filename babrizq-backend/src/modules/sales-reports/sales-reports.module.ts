/**
 * Sales + reports module — store-owner sales ledger and analytics
 * (`/api/store/sales`, `/api/store/reports`).
 */
import { Module } from '@nestjs/common';
import { ReportsService } from './application/reports.service';
import { SalesService } from './application/sales.service';
import { ReportsController } from './presentation/reports.controller';
import { SalesController } from './presentation/sales.controller';

@Module({
  controllers: [SalesController, ReportsController],
  providers: [SalesService, ReportsService],
})
export class SalesReportsModule {}
