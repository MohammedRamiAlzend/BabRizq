/**
 * Interests module — interest tracking + personalized recommendations.
 */
import { Module } from '@nestjs/common';
import { InterestsController } from './presentation/interests.controller';
import { InterestsService } from './application/interests.service';

@Module({
  controllers: [InterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}
