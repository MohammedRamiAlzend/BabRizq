/**
 * Back-office controller — platform-wide order management, driver roster,
 * and dashboard. Every route requires the `back_office` role (enforced by
 * the global guard + @Roles; other roles get 403).
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { BackofficeOrdersService } from '../application/backoffice-orders.service';
import { BackofficeDriversService } from '../application/backoffice-drivers.service';
import { BackofficeOverviewService } from '../application/backoffice-overview.service';
import {
  AssignDriverDto,
  ListBackofficeOrdersQueryDto,
  UpdateDriverAvailabilityDto,
} from './dto/backoffice.dto';

@ApiTags('Back Office')
@ApiBearerAuth()
@Roles('back_office')
@Controller('backoffice')
export class BackofficeController {
  constructor(
    private readonly orders: BackofficeOrdersService,
    private readonly drivers: BackofficeDriversService,
    private readonly overview: BackofficeOverviewService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform dashboard overview' })
  getOverview() {
    return this.overview.getOverview();
  }

  @Get('orders')
  @ApiOperation({ summary: 'All orders across all stores (paginated)' })
  listOrders(@Query() query: ListBackofficeOrdersQueryDto) {
    return this.orders.listOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Full order detail (incl. stock warnings)' })
  getOrder(@Param('id') orderId: string) {
    return this.orders.getOrder(orderId);
  }

  @Put('orders/:id/assign-driver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a driver and move the order to "assigned"' })
  assignDriver(@Param('id') orderId: string, @Body() dto: AssignDriverDto) {
    return this.orders.assignDriver(orderId, dto.driverId);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Delivery driver roster with availability' })
  listDrivers() {
    return this.drivers.listDrivers();
  }

  @Patch('drivers/:id/availability')
  @ApiOperation({ summary: 'Toggle a driver availability flag' })
  setAvailability(
    @Param('id') driverId: string,
    @Body() dto: UpdateDriverAvailabilityDto,
  ) {
    return this.drivers.setAvailability(driverId, dto.available);
  }
}
