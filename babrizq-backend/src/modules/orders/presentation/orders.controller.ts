/**
 * Orders controller — checkout + order history for the customer app.
 * Requires the `customer` role.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { OrdersService } from '../application/orders.service';
import { CreateOrderDto, ListOrdersQueryDto } from './dto/orders.dto';

@ApiTags('Customer Orders')
@ApiBearerAuth()
@Roles('customer')
@Controller('customer/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place an order from the current cart (clears the cart)' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orders.createOrder(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Order history (paginated)' })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.orders.listOrders(user.sub, query);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Full order detail (ownership enforced)' })
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ) {
    return this.orders.getOrder(user.sub, orderId);
  }
}
