/**
 * Interests controller — personalized recommendations for the customer app.
 * Requires the `customer` role.
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { InterestsService } from '../application/interests.service';
import { TrackInterestDto } from './dto/interests.dto';
import { LimitQueryDto } from '../../storefront/presentation/dto/storefront-query.dto';

@ApiTags('Customer Interests')
@ApiBearerAuth()
@Roles('customer')
@Controller('customer')
export class InterestsController {
  constructor(private readonly interests: InterestsService) {}

  @Post('interests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a customer interest event (fire-and-forget)' })
  trackInterest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TrackInterestDto,
  ): Promise<null> {
    return this.interests.trackInterest(user.sub, dto.categoryEn);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Personalized recommendations from stored interests' })
  getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LimitQueryDto,
  ) {
    return this.interests.getRecommendations(user.sub, query.limit);
  }
}
