/**
 * Store-owner controller — every endpoint requires the `store_owner` role
 * AND an `X-Store-Id` header naming a store the user owns (per the
 * store-owner `_shared.md` contract).
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { StoreProductsService } from '../application/store-products.service';
import { StoreCategoriesService } from '../application/store-categories.service';
import { StoreOrdersService } from '../application/store-orders.service';
import { StoreOverviewService } from '../application/store-overview.service';
import {
  AdvanceOrderStatusDto,
  CreateCategoryDto,
  CreateProductDto,
  ListStoreOrdersQueryDto,
  ListStoreProductsQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './dto/store.dto';

@ApiTags('Store Owner')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store')
export class StoreController {
  constructor(
    private readonly products: StoreProductsService,
    private readonly categories: StoreCategoriesService,
    private readonly orders: StoreOrdersService,
    private readonly overview: StoreOverviewService,
  ) {}

  // ---- Products ----

  @Get('products')
  @ApiOperation({ summary: 'List the store products (paginated)' })
  listProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListStoreProductsQueryDto,
  ) {
    return this.products.listProducts(user.sub, storeId, query);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a product' })
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.createProduct(user.sub, storeId, dto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product (partial)' })
  updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.updateProduct(user.sub, storeId, productId, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  deleteProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') productId: string,
  ): Promise<null> {
    return this.products.deleteProduct(user.sub, storeId, productId);
  }

  @Get('products/:id/price-history')
  @ApiOperation({ summary: 'Price history (placeholder — accounting phase model)' })
  getPriceHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') productId: string,
  ) {
    return this.products.getPriceHistory(user.sub, storeId, productId);
  }

  @Post('products/:id/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image (returns { url } to persist via the images array)' })
  uploadProductImage(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.products.uploadImage(user.sub, storeId, productId, file);
  }

  // ---- Categories ----

  @Get('categories')
  @ApiOperation({ summary: 'Store-specific categories with product counts' })
  listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.categories.listCategories(user.sub, storeId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a store-specific category' })
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categories.createCategory(user.sub, storeId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a store-specific category' })
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.updateCategory(user.sub, storeId, categoryId, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category (409 unless force=true unlinks products)' })
  deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') categoryId: string,
    @Query('force') force?: string,
  ): Promise<null> {
    return this.categories.deleteCategory(
      user.sub,
      storeId,
      categoryId,
      force === 'true',
    );
  }

  // ---- Orders ----

  @Get('orders')
  @ApiOperation({ summary: 'List the store orders (paginated)' })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListStoreOrdersQueryDto,
  ) {
    return this.orders.listOrders(user.sub, storeId, query);
  }

  @Put('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance an order exactly one step (forward only)' })
  advanceOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') orderId: string,
    @Body() dto: AdvanceOrderStatusDto,
  ) {
    return this.orders.advanceOrderStatus(user.sub, storeId, orderId, dto.status);
  }

  @Get('orders/:id/receipt')
  @ApiOperation({ summary: 'Generate a printable receipt for an order (returns its URL)' })
  getOrderReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') orderId: string,
  ) {
    return this.orders.getReceipt(user.sub, storeId, orderId);
  }

  // ---- Overview ----

  @Get('overview')
  @ApiOperation({ summary: 'Store dashboard overview (sales, stock, chart data)' })
  getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.overview.getOverview(user.sub, storeId);
  }
}
