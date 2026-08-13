/**
 * Chat module — support conversations between store owners / customers and
 * the back-office operator, exposed on `/api/store/chat` and
 * `/api/backoffice/chat`.
 */
import { Module } from '@nestjs/common';
import { ChatService } from './application/chat.service';
import { StoreChatController } from './presentation/store-chat.controller';
import { BackofficeChatController } from './presentation/backoffice-chat.controller';

@Module({
  controllers: [StoreChatController, BackofficeChatController],
  providers: [ChatService],
})
export class ChatModule {}
