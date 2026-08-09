/**
 * Root application module.
 *
 * Registers the global infrastructure (config, throttling, security guards,
 * response envelope) and the feature modules. Domain modules (customer,
 * store-owner, back-office, delivery, marketer, admin) land in the next phase
 * and are registered here as they arrive.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';
import configuration, { AppConfig } from './shared/config/configuration';
import { validate, StorageDriver } from './shared/config/env.validation';
import { ApiExceptionFilter } from './shared/common/response/api-exception.filter';
import { ApiResponseInterceptor } from './shared/common/response/api-response.interceptor';
import { JwtAuthGuard } from './shared/common/guards/jwt-auth.guard';
import { RolesGuard } from './shared/common/guards/roles.guard';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    // ---- Environment configuration (validated) ----
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [configuration],
    }),

    // ---- Rate limiting (per-IP) ----
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => [
        {
          ttl: config.get('throttle.ttlSeconds', { infer: true }),
          limit: config.get('throttle.maxRequests', { infer: true }),
        },
      ],
    }),

    // ---- Local uploads at /uploads/* (only when the local driver is active) ----
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        config.get('storage.driver', { infer: true }) === StorageDriver.Local
          ? [
              {
                rootPath: resolve(config.get('storage.path', { infer: true })),
                serveRoot: '/uploads',
              },
            ]
          : [],
    }),

    // ---- Feature modules ----
    PrismaModule,
    AuthModule,
    HealthModule,
    StorageModule,
  ],
  providers: [
    // Guard order matters: throttle → auth → roles.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
  ],
})
export class AppModule {}
