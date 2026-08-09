/**
 * Marketer module — affiliate links, targets, analytics, withdrawals, and
 * payout settings for the marketer role app.
 */
import { Module } from '@nestjs/common';
import { MarketerController } from './presentation/marketer.controller';
import { MarketerService } from './application/marketer.service';

@Module({
  controllers: [MarketerController],
  providers: [MarketerService],
})
export class MarketerModule {}
