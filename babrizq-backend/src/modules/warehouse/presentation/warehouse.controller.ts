/**
 * Warehouse controller — the store owner's stock & purchasing back office
 * (per `plans/03` §8: suppliers, purchase orders, stock movements,
 * stocktakes, valuation, alerts). All routes require the `store_owner` role
 * plus an `X-Store-Id` header naming a store the user owns.
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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { SuppliersService } from '../application/suppliers.service';
import { PurchaseOrdersService } from '../application/purchase-orders.service';
import { StockService } from '../application/stock.service';
import {
  AdjustStockDto,
  CreatePurchaseOrderDto,
  CreateStocktakeDto,
  CreateSupplierDto,
  ListPurchaseOrdersQueryDto,
  ListSuppliersQueryDto,
  ReceivePurchaseOrderDto,
  UpdateSupplierDto,
} from './dto/warehouse.dto';

@ApiTags('Store Owner Warehouse')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store')
export class WarehouseController {
  constructor(
    private readonly suppliers: SuppliersService,
    private readonly purchaseOrders: PurchaseOrdersService,
    private readonly stock: StockService,
  ) {}

  // ---- Suppliers ----

  @Get('suppliers')
  @ApiOperation({ summary: 'List the store suppliers (paginated)' })
  listSuppliers(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListSuppliersQueryDto,
  ) {
    return this.suppliers.listSuppliers(user.sub, storeId, query);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier' })
  createSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliers.createSupplier(user.sub, storeId, dto);
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Update a supplier' })
  updateSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') supplierId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliers.updateSupplier(user.sub, storeId, supplierId, dto);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Supplier detail with purchase history' })
  getSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') supplierId: string,
  ) {
    return this.suppliers.getSupplier(user.sub, storeId, supplierId);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a supplier (no purchase orders)' })
  deleteSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') supplierId: string,
  ) {
    return this.suppliers.deleteSupplier(user.sub, storeId, supplierId);
  }

  // ---- Purchase orders ----

  @Get('purchase-orders')
  @ApiOperation({ summary: 'List purchase orders (paginated)' })
  listPurchaseOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListPurchaseOrdersQueryDto,
  ) {
    return this.purchaseOrders.listPurchaseOrders(user.sub, storeId, query);
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create a purchase order' })
  createPurchaseOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrders.createPurchaseOrder(user.sub, storeId, dto);
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Purchase order detail with lines' })
  getPurchaseOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') purchaseOrderId: string,
  ) {
    return this.purchaseOrders.getPurchaseOrder(user.sub, storeId, purchaseOrderId);
  }

  @Post('purchase-orders/:id/receive')
  @ApiOperation({ summary: 'Receive goods — stock in + FIFO layer + ledger entry' })
  receivePurchaseOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') purchaseOrderId: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.purchaseOrders.receivePurchaseOrder(user.sub, storeId, purchaseOrderId, dto);
  }

  @Post('purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel an ordered purchase order' })
  cancelPurchaseOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') purchaseOrderId: string,
  ) {
    return this.purchaseOrders.cancelPurchaseOrder(user.sub, storeId, purchaseOrderId);
  }

  // ---- Stock ----

  @Post('stock/movements')
  @ApiOperation({ summary: 'Adjust stock with a reason (posts to ledger)' })
  adjustStock(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stock.adjustStock(user.sub, storeId, dto);
  }

  @Get('stock/valuation')
  @ApiOperation({ summary: 'FIFO inventory valuation (balance-sheet input)' })
  getValuation(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.stock.getValuation(user.sub, storeId);
  }

  @Get('stock/alerts')
  @ApiOperation({ summary: 'Products at/below their low-stock threshold' })
  getLowStockAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.stock.getLowStockAlerts(user.sub, storeId);
  }

  @Post('stock/stocktakes')
  @ApiOperation({ summary: 'Open a stocktake (snapshot + variance)' })
  createStocktake(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateStocktakeDto,
  ) {
    return this.stock.createStocktake(user.sub, storeId, dto);
  }

  @Get('stock/stocktakes')
  @ApiOperation({ summary: 'List stocktakes (paginated)' })
  listStocktakes(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListSuppliersQueryDto,
  ) {
    return this.stock.listStocktakes(user.sub, storeId, query);
  }

  @Post('stock/stocktakes/:id/complete')
  @ApiOperation({ summary: 'Complete a stocktake — apply counted quantities' })
  completeStocktake(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') stocktakeId: string,
  ) {
    return this.stock.completeStocktake(user.sub, storeId, stocktakeId);
  }
}
