/**
 * Store-warehouse controller — `/api/store/warehouse` (store-owner `warehouse.md`).
 * Guarded by the same `store_owner` role + owned `X-Store-Id` contract.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { StoreWarehouseService } from '../application/store-warehouse.service';
import {
  AdjustInventoryDto,
  CreateSupplierDto,
  ListInventoryQueryDto,
  UpdateSupplierDto,
} from './dto/store-warehouse.dto';

@ApiTags('Store Owner Warehouse')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/warehouse')
export class StoreWarehouseController {
  constructor(private readonly warehouse: StoreWarehouseService) {}

  @Get('inventory')
  @ApiOperation({ summary: 'List inventory levels (paginated, searchable, filter all/low/out)' })
  listInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListInventoryQueryDto,
  ) {
    return this.warehouse.listInventory(user.sub, storeId, query);
  }

  @Put('inventory/:productId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restock (positive delta) or remove (negative delta) units' })
  @ApiParam({ name: 'productId' })
  adjustInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.warehouse.adjustInventory(user.sub, storeId, productId, dto.delta, dto.note);
  }

  @Get('movements')
  @ApiOperation({ summary: 'List stock movements (paginated audit trail)' })
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: { page: number; pageSize: number },
  ) {
    return this.warehouse.listMovements(user.sub, storeId, query);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers (paginated)' })
  listSuppliers(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: { page: number; pageSize: number },
  ) {
    return this.warehouse.listSuppliers(user.sub, storeId, query);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier' })
  createSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.warehouse.createSupplier(user.sub, storeId, dto);
  }

  @Put('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a supplier (partial)' })
  updateSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') supplierId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.warehouse.updateSupplier(user.sub, storeId, supplierId, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a supplier' })
  deleteSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') supplierId: string,
  ): Promise<null> {
    return this.warehouse.deleteSupplier(user.sub, storeId, supplierId);
  }
}
