/**
 * Offers controller — store-owner promotions management (`/api/store/offers`).
 * Same guard contract as the rest of the store module: `store_owner` role +
 * an `X-Store-Id` header naming a store the user owns.
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
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { OffersService } from '../application/offers.service';
import {
  CreateOfferDto,
  ListOffersQueryDto,
  ToggleOfferDto,
  UpdateOfferDto,
} from './dto/offers.dto';

@ApiTags('Offers')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  @ApiOperation({ summary: 'List the store offers (paginated)' })
  listOffers(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListOffersQueryDto,
  ) {
    return this.offers.listOffers(user.sub, storeId, {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an offer (product-scoped or store-wide)' })
  createOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offers.createOffer(user.sub, storeId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an offer (partial)' })
  updateOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offers.updateOffer(user.sub, storeId, offerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an offer' })
  deleteOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
  ): Promise<null> {
    return this.offers.deleteOffer(user.sub, storeId, offerId);
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle the offer active flag without touching other fields' })
  toggle(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
    @Body() dto: ToggleOfferDto,
  ) {
    return this.offers.toggle(user.sub, storeId, offerId, dto.isActive);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a paused offer' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
  ) {
    return this.offers.setStatus(user.sub, storeId, offerId, 'active');
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active offer' })
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
  ) {
    return this.offers.setStatus(user.sub, storeId, offerId, 'paused');
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Offer analytics (redemptions, discount, revenue)' })
  getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') offerId: string,
  ) {
    return this.offers.getStats(user.sub, storeId, offerId);
  }
}
