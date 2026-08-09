/**
 * Storefront module — read-only catalog for the customer storefront.
 * Registers the controller + application service; Prisma is injected from
 * the global PrismaModule.
 */
import { Module } from '@nestjs/common';
import { StorefrontController } from './presentation/storefront.controller';
import { StorefrontService } from './application/storefront.service';

@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
