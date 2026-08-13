/**
 * Back-office chat controller — `/api/backoffice/chat` operator console for
 * store/customer conversations (per back-office `chat.md`). Requires the
 * `back_office` role.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { ChatService } from '../application/chat.service';
import {
  ListChatMessagesQueryDto,
  ListConversationsQueryDto,
  SendMessageDto,
} from './dto/chat.dto';

@ApiTags('Back Office Chat')
@ApiBearerAuth()
@Roles('back_office')
@Controller('backoffice/chat')
export class BackofficeChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'All conversations for this operator, most recent first' })
  listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListConversationsQueryDto,
  ) {
    return this.chat.listConversations(user.sub, query.type);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Paginated history for one conversation (marks unread as read)' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
    @Query() query: ListChatMessagesQueryDto,
  ) {
    return this.chat.listConversationMessages(user.sub, conversationId, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message from the operator in a conversation' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendBackofficeMessage(user.sub, conversationId, dto.content);
  }
}
