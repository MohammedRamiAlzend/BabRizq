/**
 * Storage module — global. Exposes the active `StorageService` chosen from
 * `STORAGE_DRIVER` (local | azure | s3) at runtime.
 */
import { Global, Inject, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../shared/config/configuration';
import { StorageDriver } from '../../shared/config/env.validation';
import { FilesController } from './files.controller';
import { AzureStorageService } from './providers/azure-storage.service';
import { LocalStorageService } from './providers/local-storage.service';
import { S3StorageService } from './providers/s3-storage.service';
import { StorageService } from './storage.types';

/**
 * Picks the active storage driver based on the environment.
 * Invalid values are rejected by env validation before this runs.
 */
export function storageFactory(
  config: ConfigService<AppConfig, true>,
  local: LocalStorageService,
  azure: AzureStorageService,
  s3: S3StorageService,
): StorageService {
  switch (config.get('storage.driver', { infer: true })) {
    case StorageDriver.Azure:
      return azure;
    case StorageDriver.S3:
      return s3;
    default:
      return local;
  }
}

@Global()
@Module({
  controllers: [FilesController],
  providers: [
    LocalStorageService,
    AzureStorageService,
    S3StorageService,
    {
      provide: StorageService,
      useFactory: storageFactory,
      inject: [
        ConfigService,
        LocalStorageService,
        AzureStorageService,
        S3StorageService,
      ],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
