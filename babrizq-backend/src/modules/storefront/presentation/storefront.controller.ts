/**
 * Storefront controller — read-only catalog endpoints for the customer app.
 *
 * All endpoints require the `customer` role (the current UI enforces login
 * for the storefront). Response shapes match the customer app's
 * `docs/needed-endpoints-from-backend/*` contracts.
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { StorefrontService } from '../application/storefront.service';
import {
  CategoryCatalogQueryDto,
  LimitQueryDto,
  ListProductsQueryDto,
  RecommendationsQueryDto,
  StoreProductsQueryDto,
} from './dto/storefront-query.dto';

@ApiTags('Storefront')
@ApiBearerAuth()
@Roles('customer')
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get('stores')
  @ApiOperation({ summary: 'All stores with product counts (Browse by Store)' })
  getStores() {
    return this.storefront.getStores();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Platform categories with deal indicators' })
  getCategories() {
    return this.storefront.getCategories();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Flash Deals / featured products' })
  getFeatured(@Query() query: LimitQueryDto) {
    return this.storefront.getFeatured(query.limit);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Recommendations from client-side interest categories' })
  getRecommendations(@Query() query: RecommendationsQueryDto) {
    return this.storefront.getRecommendations(query.categories ?? [], query.limit);
  }

  @Get('ads')
  @ApiOperation({ summary: 'Global homepage promotional banners' })
  getAds() {
    return this.storefront.getAds();
  }

  @Get('products')
  @ApiOperation({ summary: 'Paginated, filterable product list with price range' })
  listProducts(@Query() query: ListProductsQueryDto) {
    return this.storefront.listProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Single product detail' })
  getProduct(@Param('id') id: string) {
    return this.storefront.getProduct(id);
  }

  @Get('categories/:categoryEn')
  @ApiOperation({ summary: 'Category catalog: products, tag groups, related categories, ads' })
  getCategoryCatalog(
    @Param('categoryEn') categoryEn: string,
    @Query() query: CategoryCatalogQueryDto,
  ) {
    return this.storefront.getCategoryCatalog(categoryEn, query);
  }

  @Get('categories/:categoryEn/stores')
  @ApiOperation({ summary: 'Stores selling in a platform category' })
  getCategoryStores(
    @Param('categoryEn') categoryEn: string,
    @Query() query: LimitQueryDto,
  ) {
    return this.storefront.getCategoryStores(categoryEn, query.limit);
  }

  @Get('categories/:categoryEn/ads')
  @ApiOperation({ summary: 'Category-specific promotional banners' })
  getCategoryAds(@Param('categoryEn') categoryEn: string) {
    return this.storefront.getCategoryAds(categoryEn);
  }

  @Get('stores/:storeId')
  @ApiOperation({ summary: 'Store detail with sub-categories and ads' })
  getStore(@Param('storeId') storeId: string) {
    return this.storefront.getStore(storeId);
  }

  @Get('stores/:storeId/products')
  @ApiOperation({ summary: 'Store products with sub-category counts' })
  getStoreProducts(
    @Param('storeId') storeId: string,
    @Query() query: StoreProductsQueryDto,
  ) {
    return this.storefront.getStoreProducts(storeId, query);
  }

  @Get('stores/:storeId/similar')
  @ApiOperation({ summary: 'Similar stores in the same category' })
  getSimilarStores(
    @Param('storeId') storeId: string,
    @Query() query: LimitQueryDto,
  ) {
    return this.storefront.getSimilarStores(storeId, query.limit);
  }

  @Get('stores/:storeId/more-in-category')
  @ApiOperation({ summary: 'Same-category products from other stores' })
  getMoreInCategory(
    @Param('storeId') storeId: string,
    @Query() query: LimitQueryDto,
  ) {
    return this.storefront.getMoreInCategory(storeId, query.limit);
  }

  @Get('stores/:storeId/ads')
  @ApiOperation({ summary: 'Store-specific promotional banners' })
  getStoreAds(@Param('storeId') storeId: string) {
    return this.storefront.getStoreAds(storeId);
  }
}
