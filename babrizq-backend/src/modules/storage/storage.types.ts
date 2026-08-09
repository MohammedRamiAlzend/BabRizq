/**
 * Storage abstraction — the port every storage driver implements.
 *
 * Domain modules depend on `StorageService` (never on a concrete driver), so
 * switching between local disk, Azure Blob and AWS S3 is purely an
 * environment change (`STORAGE_DRIVER`).
 */

/** Normalized upload payload passed to `StorageService.save`. */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Result of a successful upload. */
export interface StoredFile {
  /** Storage key (relative path / blob name) — used to delete later. */
  key: string;
  /** Public URL of the stored file. */
  url: string;
}

export abstract class StorageService {
  /** Human-readable driver name (local | azure | s3). */
  abstract readonly driver: string;

  /**
   * Stores a file under `<folder>/<uuid>.<ext>` and returns its key + URL.
   * @param folder optional logical folder (e.g. "products", "proof-of-delivery")
   */
  abstract save(file: UploadedFileData, folder?: string): Promise<StoredFile>;

  /** Deletes a file by its storage key. Missing files are a no-op. */
  abstract delete(key: string): Promise<void>;
}
