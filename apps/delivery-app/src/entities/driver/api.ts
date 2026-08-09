/**
 * Driver entity — mock API (delivery driver app).
 *
 * Simulates the driver profile endpoint from
 * `docs/needed-endpoints-from-backend.md` (`GET /api/delivery/me`). Seed data
 * is copied verbatim from the legacy monolith.
 */
import { MockDriver } from './model';

/** In-memory driver roster. TODO(migration): replaced by `GET /api/delivery/me`. */
export const MOCK_DRIVERS: MockDriver[] = [
  { id: 'd1', nameEn: 'Yusuf Al-Mutairi', nameAr: 'يوسف المطيري', phone: '+966 55 123 4567', available: true },
  { id: 'd2', nameEn: 'Hassan Farooq', nameAr: 'حسن فاروق', phone: '+966 55 234 5678', available: true },
  { id: 'd3', nameEn: 'Ali Al-Dosari', nameAr: 'علي الدوسري', phone: '+966 55 345 6789', available: false },
  { id: 'd4', nameEn: 'Majed Saleh', nameAr: 'ماجد صالح', phone: '+966 55 456 7890', available: true },
];

/** Simulates `GET /api/delivery/me`. */
export async function getDrivers(): Promise<MockDriver[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_DRIVERS), 100));
}
