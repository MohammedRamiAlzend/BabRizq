/**
 * Paginated list shape — matches the frontend contract
 * `{ items, totalItems, page, pageSize, totalPages }`.
 */
import { ApiProperty } from '@nestjs/swagger';

export class Paginated<T> {
  items!: T[];
  totalItems!: number;
  page!: number;
  pageSize!: number;
  totalPages!: number;

  static from<T>(items: T[], totalItems: number, page: number, pageSize: number): Paginated<T> {
    return {
      items,
      totalItems,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0,
    };
  }
}

/** Pure helper kept for unit-testability (no framework imports needed). */
export function buildPaginated<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return Paginated.from(items, totalItems, page, pageSize);
}
