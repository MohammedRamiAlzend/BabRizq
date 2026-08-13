/**
 * Back-office drivers service — driver roster and availability management.
 */
import { Injectable } from '@nestjs/common';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import { DriverView, toDriverView } from './backoffice.mapper';

const DRIVER_INCLUDE = { driverProfile: true } as const;

@Injectable()
export class BackofficeDriversService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /backoffice/drivers — full roster (small enough to skip pagination). */
  async listDrivers(): Promise<DriverView[]> {
    const drivers = await this.prisma.user.findMany({
      where: { role: 'delivery' },
      include: DRIVER_INCLUDE,
      orderBy: { nameEn: 'asc' },
    });
    return drivers.map((driver) => toDriverView(driver));
  }

  /**
   * PATCH /backoffice/drivers/:id/availability — toggle availability.
   * A driver with an `in_transit` order cannot be marked available
   * (DRIVER_HAS_ACTIVE_ORDER 409).
   */
  async setAvailability(driverId: string, available: boolean): Promise<DriverView> {
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      include: DRIVER_INCLUDE,
    });
    if (!driver || driver.role !== 'delivery') {
      throw ApiError.notFound('DRIVER_NOT_FOUND', 'Driver not found');
    }

    if (available) {
      const active = await this.prisma.order.count({
        where: { assignedDriverId: driverId, status: 'in_transit' },
      });
      if (active > 0) {
        throw ApiError.conflict(
          'DRIVER_HAS_ACTIVE_ORDER',
          'Cannot mark available while the driver has an in-transit order',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data: {
        driverProfile: {
          upsert: {
            create: { available },
            update: { available },
          },
        },
      },
      include: DRIVER_INCLUDE,
    });
    return toDriverView(updated);
  }

  /**
   * GET /backoffice/drivers/locations — live driver pin data for the map
   * (map.md). Coordinates are derived from the driver's active order
   * (assigned/in_transit); drivers without one report `available`.
   */
  async getLocations(): Promise<DriverLocationView[]> {
    const drivers = await this.prisma.user.findMany({
      where: { role: 'delivery' },
      include: { driverProfile: true },
      orderBy: { nameEn: 'asc' },
    });
    const orders = await this.prisma.order.findMany({
      where: {
        assignedDriverId: { in: drivers.map((driver) => driver.id) },
        status: { in: ['assigned', 'in_transit'] },
      },
      select: {
        assignedDriverId: true,
        lat: true,
        lng: true,
        status: true,
        updatedAt: true,
      },
    });

    // Newest active order per driver wins (findMany is unsorted, so keep the
    // first occurrence per driver for a stable pick).
    const byDriver = new Map<string, (typeof orders)[number]>();
    for (const order of orders) {
      if (order.assignedDriverId && !byDriver.has(order.assignedDriverId)) {
        byDriver.set(order.assignedDriverId, order);
      }
    }

    return drivers.map((driver): DriverLocationView => {
      const active = byDriver.get(driver.id);
      if (!active) {
        return {
          driverId: driver.id,
          lat: 0,
          lng: 0,
          status: 'available',
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        driverId: driver.id,
        lat: active.lat ?? 0,
        lng: active.lng ?? 0,
        status: active.status === 'in_transit' ? 'in_transit' : 'assigned',
        updatedAt: active.updatedAt.toISOString(),
      };
    });
  }
}

/** DriverLocation shape (back-office map.md). */
export interface DriverLocationView {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  status: 'available' | 'assigned' | 'in_transit';
  updatedAt: string;
}
