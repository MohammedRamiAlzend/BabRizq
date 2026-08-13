/**
 * Store-settings application service — the store owner's settings tabs
 * (Store Info / Payment / Notifications / Shipping) and password change.
 *
 * The view merges the `Store` row (name/description) with the
 * `StoreSettings` row (payment/shipping/notification prefs). The settings
 * row is created lazily with defaults on first read so a brand-new store
 * never 404s.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService, UploadedFileData } from '../../storage/storage.types';
import { resolveOwnedStore } from './store-context';
import { UpdateStoreSettingsDto } from '../presentation/dto/store-settings.dto';

/** StoreSettings shape (store-owner settings.md). */
export interface StoreSettingsView {
  storeNameEn: string;
  storeNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  taxRate: number;
  acceptedCurrencies: string[];
  paymentMethods: string[];
  notifyNewOrder: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;
  deliveryFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: number;
}

const DEFAULT_CURRENCIES = ['SAR'];
const DEFAULT_PAYMENT_METHODS = ['cash'];

@Injectable()
export class StoreSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** GET /store/settings — merged Store + StoreSettings view (lazy defaults). */
  async getSettings(
    ownerUserId: string,
    storeId: string | undefined,
  ): Promise<StoreSettingsView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const [storeRow, settings] = await Promise.all([
      this.prisma.store.findUnique({ where: { id: store.id } }),
      this.ensureSettings(store.id),
    ]);
    return this.toView(storeRow!, settings);
  }

  /** PUT /store/settings — partial update (any tab), returns the full view. */
  async updateSettings(
    ownerUserId: string,
    storeId: string | undefined,
    dto: UpdateStoreSettingsDto,
  ): Promise<StoreSettingsView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const [storeRow, settings] = await Promise.all([
      this.prisma.store.findUnique({ where: { id: store.id } }),
      this.ensureSettings(store.id),
    ]);

    const storeData: Prisma.StoreUpdateInput = {};
    if (dto.storeNameEn !== undefined) storeData.nameEn = dto.storeNameEn;
    if (dto.storeNameAr !== undefined) storeData.nameAr = dto.storeNameAr;
    if (dto.descriptionEn !== undefined) storeData.descriptionEn = dto.descriptionEn;
    if (dto.descriptionAr !== undefined) storeData.descriptionAr = dto.descriptionAr;

    const settingsData: Prisma.StoreSettingsUncheckedUpdateInput = {};
    if (dto.logoUrl !== undefined) settingsData.logoUrl = dto.logoUrl;
    if (dto.coverUrl !== undefined) settingsData.coverUrl = dto.coverUrl;
    if (dto.contactEmail !== undefined) settingsData.contactEmail = dto.contactEmail;
    if (dto.phone !== undefined) settingsData.phone = dto.phone;
    if (dto.address !== undefined) {
      settingsData.addressEn = dto.address;
      settingsData.addressAr = dto.address;
    }
    if (dto.taxRate !== undefined) settingsData.taxRate = dto.taxRate;
    if (dto.acceptedCurrencies !== undefined) {
      settingsData.acceptedCurrenciesJson = JSON.stringify(dto.acceptedCurrencies);
    }
    if (dto.paymentMethods !== undefined) {
      settingsData.paymentMethodsJson = JSON.stringify(dto.paymentMethods);
    }
    if (dto.notifyNewOrder !== undefined) settingsData.notifyNewOrder = dto.notifyNewOrder;
    if (dto.notifyLowStock !== undefined) settingsData.notifyLowStock = dto.notifyLowStock;
    if (dto.lowStockThreshold !== undefined) settingsData.lowStockThreshold = dto.lowStockThreshold;
    if (dto.deliveryFee !== undefined) settingsData.deliveryFee = dto.deliveryFee;
    if (dto.freeShippingThreshold !== undefined) {
      settingsData.freeShippingThreshold = dto.freeShippingThreshold;
    }
    if (dto.estimatedDeliveryDays !== undefined) {
      settingsData.estimatedDeliveryDays = dto.estimatedDeliveryDays;
    }

    const [updatedStore, updatedSettings] = await this.prisma.$transaction([
      this.prisma.store.update({ where: { id: store.id }, data: storeData }),
      this.prisma.storeSettings.update({
        where: { storeId: store.id },
        data: settingsData,
      }),
    ]);
    return this.toView(updatedStore, updatedSettings);
  }

  /** PUT /store/settings/logo|cover — stores the image, returns { url }. */
  async uploadImage(
    ownerUserId: string,
    storeId: string | undefined,
    file: UploadedFileData | undefined,
  ): Promise<{ url: string }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    if (!file || file.size === 0) {
      throw ApiError.badRequest('NO_FILE_UPLOADED', 'No file uploaded');
    }
    const stored = await this.storage.save(file, 'store-assets');
    // The client persists the URL via PUT /store/settings afterwards.
    return { url: stored.url };
  }

  /**
   * POST /store/settings/change-password — verifies the current password,
   * then re-hashes the account (error codes per settings.md).
   */
  async changePassword(
    ownerUserId: string,
    storeId: string | undefined,
    dto: { currentPassword: string; newPassword: string; confirmPassword: string },
  ): Promise<null> {
    await resolveOwnedStore(this.prisma, ownerUserId, storeId);

    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
    });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new ApiError('WRONG_CURRENT_PASSWORD', 401, 'Current password is incorrect');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ApiError('PASSWORDS_DO_NOT_MATCH', 422, 'New password and confirmation do not match');
    }
    if (dto.newPassword.length < 8) {
      throw new ApiError('PASSWORD_TOO_SHORT', 422, 'New password must be at least 8 characters');
    }

    await this.prisma.user.update({
      where: { id: ownerUserId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return null;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Reads (or lazily creates with defaults) the store's settings row. */
  private async ensureSettings(storeId: string) {
    const existing = await this.prisma.storeSettings.findUnique({
      where: { storeId },
    });
    if (existing) return existing;
    return this.prisma.storeSettings.create({
      data: { storeId },
    });
  }

  private toView(
    store: {
      nameEn: string;
      nameAr: string;
      descriptionEn: string | null;
      descriptionAr: string | null;
    },
    settings: {
      logoUrl: string | null;
      contactEmail: string | null;
      phone: string | null;
      addressEn: string | null;
      taxRate: number;
      acceptedCurrenciesJson: string;
      paymentMethodsJson: string;
      notifyNewOrder: boolean;
      notifyLowStock: boolean;
      lowStockThreshold: number;
      deliveryFee: number;
      freeShippingThreshold: number;
      estimatedDeliveryDays: number;
    },
  ): StoreSettingsView {
    return {
      storeNameEn: store.nameEn,
      storeNameAr: store.nameAr,
      descriptionEn: store.descriptionEn ?? '',
      descriptionAr: store.descriptionAr ?? '',
      logoUrl: settings.logoUrl ?? '',
      contactEmail: settings.contactEmail ?? '',
      phone: settings.phone ?? '',
      address: settings.addressEn ?? '',
      taxRate: settings.taxRate,
      acceptedCurrencies: this.parseList(settings.acceptedCurrenciesJson, DEFAULT_CURRENCIES),
      paymentMethods: this.parseList(settings.paymentMethodsJson, DEFAULT_PAYMENT_METHODS),
      notifyNewOrder: settings.notifyNewOrder,
      notifyLowStock: settings.notifyLowStock,
      lowStockThreshold: settings.lowStockThreshold,
      deliveryFee: settings.deliveryFee,
      freeShippingThreshold: settings.freeShippingThreshold,
      estimatedDeliveryDays: settings.estimatedDeliveryDays,
    };
  }

  private parseList(json: string, fallback: string[]): string[] {
    try {
      const parsed = JSON.parse(json) as unknown;
      return Array.isArray(parsed)
        ? (parsed.filter((item): item is string => typeof item === 'string'))
        : fallback;
    } catch {
      return fallback;
    }
  }
}
