/**
 * Admin settings service — the singleton platform configuration row
 * (`settings.md`). The row (id = 1) is created on first read with sensible
 * defaults if it is missing, so GET /admin/settings never 404s.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PlatformSettingsView,
  toPlatformSettingsView,
} from './admin.mapper';

/** Defaults used when the singleton row does not exist yet. */
const DEFAULT_SETTINGS = {
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
};

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /admin/settings — returns the singleton (creating it if needed). */
  async getSettings(): Promise<PlatformSettingsView> {
    const settings =
      (await this.prisma.platformSetting.findUnique({ where: { id: 1 } })) ??
      (await this.prisma.platformSetting.create({
        data: { id: 1, ...DEFAULT_SETTINGS },
      }));
    return toPlatformSettingsView(settings);
  }

  /** PUT /admin/settings — partial update of the singleton row. */
  async updateSettings(
    dto: Partial<PlatformSettingsView>,
  ): Promise<PlatformSettingsView> {
    const changes = {
      ...(dto.platformName !== undefined ? { platformName: dto.platformName } : {}),
      ...(dto.supportEmail !== undefined ? { supportEmail: dto.supportEmail } : {}),
      ...(dto.defaultCurrency !== undefined
        ? { defaultCurrency: dto.defaultCurrency }
        : {}),
      ...(dto.commissionRate !== undefined
        ? { commissionRate: dto.commissionRate }
        : {}),
      ...(dto.maintenanceMode !== undefined
        ? { maintenanceMode: dto.maintenanceMode }
        : {}),
    };

    const updated = await this.prisma.platformSetting.upsert({
      where: { id: 1 },
      update: changes,
      create: { id: 1, ...DEFAULT_SETTINGS, ...changes },
    });
    return toPlatformSettingsView(updated);
  }
}
