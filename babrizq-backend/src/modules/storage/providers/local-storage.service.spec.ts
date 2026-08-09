/**
 * Unit tests for LocalStorageService — verifies file writes land under the
 * configured path with safe extension handling, and that delete is a no-op
 * for missing files.
 */
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorageService } from './local-storage.service';
import { AppConfig } from '../../../shared/config/configuration';

describe('LocalStorageService', () => {
  let dir: string;
  let service: LocalStorageService;

  const config = {
    get: jest.fn((key: string) =>
      key === 'storage.path' ? dir : undefined,
    ),
  } as unknown as ConfigService<AppConfig, true>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'babrizq-storage-'));
    service = new LocalStorageService(config);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes the buffer to <folder>/<uuid>.<ext> and returns a public URL', async () => {
    const result = await service.save(
      { originalname: 'photo.JPG', mimetype: 'image/jpeg', size: 3, buffer: Buffer.from('abc') },
      'products',
    );

    expect(result.url).toMatch(/^\/uploads\/products\/[0-9a-f-]+\.jpg$/);
    const onDisk = await readFile(join(dir, result.key));
    expect(onDisk.toString()).toBe('abc');
  });

  it('defaults the folder to "general"', async () => {
    const result = await service.save({
      originalname: 'a.png',
      mimetype: 'image/png',
      size: 1,
      buffer: Buffer.from('x'),
    });
    expect(result.key.startsWith('general/')).toBe(true);
  });

  it('keeps only alphanumeric extensions up to 10 chars', async () => {
    // Valid short alphanumeric extension → kept, lowercased.
    const ok = await service.save({
      originalname: 'photo.PNG',
      mimetype: 'image/png',
      size: 1,
      buffer: Buffer.from('x'),
    });
    expect(ok.key.endsWith('.png')).toBe(true);

    // Oversized extension (11 chars) → stripped.
    const tooLong = await service.save({
      originalname: 'evil.abcdefghijk',
      mimetype: 'text/plain',
      size: 1,
      buffer: Buffer.from('x'),
    });
    expect(tooLong.key.endsWith('.abcdefghijk')).toBe(false);

    // Extension with special characters → stripped.
    const special = await service.save({
      originalname: 'evil.tx?t',
      mimetype: 'text/plain',
      size: 1,
      buffer: Buffer.from('x'),
    });
    expect(special.key.endsWith('.tx?t')).toBe(false);

    // No extension at all → no trailing dot.
    const noExt = await service.save({
      originalname: 'README',
      mimetype: 'text/plain',
      size: 1,
      buffer: Buffer.from('x'),
    });
    expect(noExt.key.endsWith('.')).toBe(false);
  });

  it('delete removes the file and tolerates missing files', async () => {
    const result = await service.save({
      originalname: 'a.txt',
      mimetype: 'text/plain',
      size: 1,
      buffer: Buffer.from('x'),
    });
    await service.delete(result.key);
    await expect(readFile(join(dir, result.key))).rejects.toThrow();

    // No-op — must not throw.
    await expect(service.delete('does/not/exist.txt')).resolves.toBeUndefined();
  });
});
