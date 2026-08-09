/**
 * Prisma module — global, so any feature module can inject `PrismaService`
 * without importing it explicitly.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
