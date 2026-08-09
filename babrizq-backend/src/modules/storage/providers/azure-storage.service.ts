/**
 * Azure Blob storage driver — selected with `STORAGE_DRIVER=azure`.
 * Requires `AZURE_STORAGE_CONNECTION_STRING` (+ optional `AZURE_CONTAINER_NAME`).
 */
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { AppConfig } from '../../../shared/config/configuration';
import { StorageService, StoredFile, UploadedFileData } from '../storage.types';

@Injectable()
export class AzureStorageService extends StorageService {
  readonly driver = 'azure';

  private readonly container: ContainerClient | null;

  constructor(
    @Inject(ConfigService) config: ConfigService<AppConfig, true>,
  ) {
    super();
    const connectionString = config.get('storage.azure.connectionString', {
      infer: true,
    });
    this.container = connectionString
      ? new BlobServiceClient(connectionString).getContainerClient(
          config.get('storage.azure.container', { infer: true }),
        )
      : null;
  }

  async save(file: UploadedFileData, folder = 'general'): Promise<StoredFile> {
    if (!this.container) {
      throw new ServiceUnavailableException(
        'Azure Blob storage is not configured (AZURE_STORAGE_CONNECTION_STRING)',
      );
    }
    const key = `${folder}/${randomUUID()}${this.sanitizedExt(file.originalname)}`;
    const blockBlob = this.container.getBlockBlobClient(key);

    await blockBlob.upload(file.buffer, file.size, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return { key, url: blockBlob.url };
  }

  async delete(key: string): Promise<void> {
    if (!this.container) return;
    await this.container.deleteBlob(key).catch(() => undefined);
  }

  private sanitizedExt(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
  }
}
