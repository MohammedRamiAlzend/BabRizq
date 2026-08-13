/**
 * Store-owner chat controller — `/api/store/chat` support thread between the
 * store and the platform (per store-owner `chat.md`). Requires the
 * `store_owner` role + an `X-Store-Id` header naming a store the user owns.
 */
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { ChatService } from '../application/chat.service';
import {
  ListChatMessagesQueryDto,
  MarkMessagesReadDto,
  SendMessageDto,
} from './dto/chat.dto';

@ApiTags('Store Owner Chat')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/chat')
export class StoreChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Paginated chat history between this store and the platform' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListChatMessagesQueryDto,
  ) {
    return this.chat.listStoreMessages(user.sub, storeId, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message from the store owner to the platform' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendStoreMessage(user.sub, storeId, dto.content);
  }

  @Put('messages/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one or more messages as read (store owner)' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: MarkMessagesReadDto,
  ): Promise<null> {
    return this.chat.markStoreMessagesRead(user.sub, storeId, dto.messageIds);
  }
}
