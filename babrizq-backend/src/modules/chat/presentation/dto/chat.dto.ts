/**
 * Chat request DTOs — the store-owner and back-office chat contracts
 * (store-owner `chat.md` + back-office `chat.md`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class SendMessageDto {
  @ApiProperty({ description: 'Plain-text message body', example: 'Hello, I need help.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

export class MarkMessagesReadDto {
  @ApiProperty({ type: [String], description: 'ChatMessage UUIDs to mark as read' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  messageIds!: string[];
}

export class ListChatMessagesQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  pageSize: number = 50;
}

export class ListConversationsQueryDto {
  @ApiPropertyOptional({ enum: ['customer', 'store'], description: 'Filter by conversation type' })
  @IsOptional()
  @IsIn(['customer', 'store'])
  type?: string;
}
