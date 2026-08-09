/**
 * Local storage driver — writes files into the project folder
 * (`STORAGE_PATH`, default `./uploads`) and serves them statically at
 * `/uploads/*` via ServeStaticModule. Zero-config "native" option.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { AppConfig } from '../../../shared/config/configuration';
import { StorageService, StoredFile, UploadedFileData } from '../storage.types';

@Injectable()
export class LocalStorageService extends StorageService {
  readonly driver = 'local';

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<AppConfig, true>,
  ) {
    super();
  }

  /** Absolute path of the uploads directory. */
  private get rootPath(): string {
    return resolve(this.config.get('storage.path', { infer: true }));
  }

  async save(file: UploadedFileData, folder = 'general'): Promise<StoredFile> {
    const key = `${folder}/${randomUUID()}${this.sanitizedExt(file.originalname)}`;
    const destination = join(this.rootPath, key);

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.buffer);

    return { key, url: `/uploads/${key}` };
  }

  async delete(key: string): Promise<void> {
    await unlink(join(this.rootPath, key)).catch(() => undefined);
  }

  /** Keeps only a safe extension (≤10 chars, alphanumeric) from a filename. */
  private sanitizedExt(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
  }
}
