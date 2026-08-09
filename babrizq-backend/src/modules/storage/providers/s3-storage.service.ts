/**
 * AWS S3 storage driver — selected with `STORAGE_DRIVER=s3`.
 * Requires `AWS_S3_BUCKET` (+ `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`,
 * `AWS_SECRET_ACCESS_KEY`). Uses path-style public URLs for simplicity; the
 * bucket must allow public reads or sit behind a CDN.
 */
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppConfig } from '../../../shared/config/configuration';
import { StorageService, StoredFile, UploadedFileData } from '../storage.types';

@Injectable()
export class S3StorageService extends StorageService {
  readonly driver = 's3';

  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly region: string;

  constructor(
    @Inject(ConfigService) config: ConfigService<AppConfig, true>,
  ) {
    super();
    this.bucket = config.get('storage.s3.bucket', { infer: true });
    this.region = config.get('storage.s3.region', { infer: true });
    const accessKeyId = config.get('storage.s3.accessKeyId', { infer: true });
    const secretAccessKey = config.get('storage.s3.secretAccessKey', {
      infer: true,
    });

    this.client =
      this.bucket && accessKeyId && secretAccessKey
        ? new S3Client({
            region: this.region,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  async save(file: UploadedFileData, folder = 'general'): Promise<StoredFile> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException(
        'S3 storage is not configured (AWS_S3_BUCKET + credentials)',
      );
    }
    const key = `${folder}/${randomUUID()}${this.sanitizedExt(file.originalname)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.bucket) return;
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => undefined);
  }

  private sanitizedExt(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
  }
}
