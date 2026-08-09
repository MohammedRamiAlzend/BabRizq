/**
 * Cart controller — per-customer cart endpoints (`/api/customer/cart*`).
 * Requires the `customer` role (global JWT guard + @Roles).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { CartService } from '../application/cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('Customer Cart')
@ApiBearerAuth()
@Roles('customer')
@Controller('customer/cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current customer cart' })
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.getCart(user.sub);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a product to the cart (increments by 1)' })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.addItem(user.sub, dto.productId);
  }

  @Put('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set quantity (0 removes the item)' })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(user.sub, productId, dto.quantity);
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ) {
    return this.cart.removeItem(user.sub, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the whole cart' })
  clearCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.clearCart(user.sub);
  }
}
