/**
 * Reports controller — `/api/store/reports` (store-owner `reports.md`).
 * Read-only analytics over delivered orders + product/category aggregation.
 */
import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { ReportsService } from '../application/reports.service';
import {
  ProductsReportQueryDto,
  SalesReportQueryDto,
} from './dto/sales-reports.dto';

@ApiTags('Store Owner Reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales grouped weekly (Mon–Sun) or monthly (Jan–Dec)' })
  salesReport(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: SalesReportQueryDto,
  ) {
    return this.reports.salesReport(user.sub, storeId, query.period);
  }

  @Get('products')
  @ApiOperation({ summary: 'Top-selling products by revenue (paginated)' })
  productsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ProductsReportQueryDto,
  ) {
    return this.reports.productsReport(user.sub, storeId, query);
  }

  @Get('revenue-by-currency')
  @ApiOperation({ summary: 'Revenue per currency with month-over-month trend' })
  revenueByCurrency(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.reports.revenueByCurrency(user.sub, storeId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Reports-page KPI cards' })
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.reports.summary(user.sub, storeId);
  }
}
