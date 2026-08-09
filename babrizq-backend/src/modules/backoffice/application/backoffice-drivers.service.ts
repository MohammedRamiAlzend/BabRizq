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
}
