/**
 * Marketer controller — affiliate links, targets, dashboard KPIs,
 * withdrawals, performance analytics, and payout/notification settings.
 * Every route requires the `marketer` role (other roles get 403).
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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { MarketerService } from '../application/marketer.service';
import {
  GenerateLinkDto,
  ListLinksQueryDto,
  PerformanceQueryDto,
  UpdateMarketerSettingsDto,
  WithdrawDto,
} from './dto/marketer.dto';

@ApiTags('Marketer')
@ApiBearerAuth()
@Roles('marketer')
@Controller('marketer')
export class MarketerController {
  constructor(private readonly marketer: MarketerService) {}

  @Get('links')
  @ApiOperation({ summary: 'Paginated affiliate links (type-filterable)' })
  listLinks(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLinksQueryDto) {
    return this.marketer.listLinks(user.sub, query);
  }

  @Post('links/generate')
  @ApiOperation({ summary: 'Create (or return the existing) tracking link for a target' })
  generateLink(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateLinkDto) {
    return this.marketer.generateLink(user.sub, dto);
  }

  @Delete('links/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete one of the marketer own links' })
  deleteLink(@CurrentUser() user: AuthenticatedUser, @Param('id') linkId: string) {
    return this.marketer.deleteLink(user.sub, linkId);
  }

  @Get('targets')
  @ApiOperation({ summary: 'Stores + products available as affiliate targets' })
  listTargets(@Query('search') search?: string) {
    return this.marketer.listTargets(search);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Affiliate dashboard headline metrics' })
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.marketer.overview(user.sub);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Submit a withdrawal request against the balance' })
  withdraw(@CurrentUser() user: AuthenticatedUser, @Body() dto: WithdrawDto) {
    return this.marketer.withdraw(user.sub, dto);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Performance analytics (weekly/monthly, optional linkId)' })
  getPerformance(@CurrentUser() user: AuthenticatedUser, @Query() query: PerformanceQueryDto) {
    return this.marketer.performance(user.sub, query);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Payout + notification preferences' })
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.marketer.getSettings(user.sub);
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payout + notification preferences' })
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMarketerSettingsDto,
  ) {
    return this.marketer.updateSettings(user.sub, dto);
  }
}
