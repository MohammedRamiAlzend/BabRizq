/**
 * Driver entity — mock API (back office).
 *
 * Simulates `GET /api/backoffice/drivers` from
 * `docs/needed-endpoints-from-backend.md`. Seed data is copied verbatim from
 * the legacy monolith.
 */
import { MockDriver } from './model';
import { api } from '@/shared/lib/api';

/** In-memory driver roster. TODO(migration): replaced by `GET /api/backoffice/drivers`. */
export const MOCK_DRIVERS: MockDriver[] = [
  { id: 'd1', nameEn: 'Yusuf Al-Mutairi', nameAr: 'يوسف المطيري', phone: '+966 55 123 4567', available: true },
  { id: 'd2', nameEn: 'Hassan Farooq', nameAr: 'حسن فاروق', phone: '+966 55 234 5678', available: true },
  { id: 'd3', nameEn: 'Ali Al-Dosari', nameAr: 'علي الدوسري', phone: '+966 55 345 6789', available: false },
  { id: 'd4', nameEn: 'Majed Saleh', nameAr: 'ماجد صالح', phone: '+966 55 456 7890', available: true },
];

/** Backend `DriverView` shape (back-office `_shared.md`) — DTO boundary. */
interface DriverDto {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  available: boolean;
  activeOrderId?: string;
}

/** GET /backoffice/drivers — the delivery driver roster. */
export async function getDrivers(): Promise<MockDriver[]> {
  const drivers = await api.get<DriverDto[]>('/backoffice/drivers');
  return drivers.map((driver) => ({
    id: driver.id,
    nameEn: driver.nameEn,
    nameAr: driver.nameAr,
    phone: driver.phone,
    available: driver.available,
  }));
}
