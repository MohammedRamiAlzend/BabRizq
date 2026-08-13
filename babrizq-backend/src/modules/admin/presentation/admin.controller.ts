/**
 * Admin controller — platform overview, user management, and platform
 * settings. Every route requires the `admin` role (other roles get 403).
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
import { AdminUsersService } from '../application/admin-users.service';
import { AdminSettingsService } from '../application/admin-settings.service';
import { AdminOverviewService } from '../application/admin-overview.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  ListUsersQueryDto,
  UpdateMeDto,
  UpdatePlatformSettingsDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly settings: AdminSettingsService,
    private readonly overview: AdminOverviewService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform dashboard metrics' })
  getOverview() {
    return this.overview.getOverview();
  }

  @Get('me')
  @ApiOperation({ summary: 'Current admin profile' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getMe(user.sub);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current admin profile (partial)' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.sub, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the current admin password' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<null> {
    return this.users.changePassword(user.sub, dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Paginated platform users (search + role filter)' })
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.users.listUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a platform user (any role)' })
  createUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ) {
    return this.users.createUser(actor.sub, dto);
  }

  @Put('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a user role' })
  updateRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.updateRole(userId, dto.role);
  }

  @Put('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or suspend a user' })
  updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.users.updateStatus(userId, dto.status, actor.sub);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a platform user' })
  deleteUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') userId: string,
  ) {
    return this.users.deleteUser(userId, actor.sub);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Platform-wide settings (singleton)' })
  getSettings() {
    return this.settings.getSettings();
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update platform-wide settings' })
  updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.settings.updateSettings(dto);
  }
}
