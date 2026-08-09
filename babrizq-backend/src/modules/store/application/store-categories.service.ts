/**
 * Store-categories application service — store-specific category CRUD.
 * Deleting a category with linked products requires `force=true`
 * (`CATEGORY_HAS_PRODUCTS` 409 otherwise, per categories.md).
 */
import { Injectable } from '@nestjs/common';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreCategoryView, toStoreCategoryView } from './store.mapper';
import { resolveOwnedStore } from './store-context';

export interface CreateCategoryInput {
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;
}

@Injectable()
export class StoreCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/categories — all store categories with product counts. */
  async listCategories(
    ownerUserId: string,
    storeId: string | undefined,
  ): Promise<StoreCategoryView[]> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const [categories, groups] = await Promise.all([
      this.prisma.storeCategory.findMany({
        where: { storeId: store.id },
        orderBy: { nameEn: 'asc' },
      }),
      this.prisma.product.groupBy({
        by: ['storeCategoryId'],
        where: { storeId: store.id, storeCategoryId: { not: null } },
        _count: true,
      }),
    ]);
    const counts = new Map(groups.map((g) => [g.storeCategoryId, g._count]));
    return categories.map((category) =>
      toStoreCategoryView(category, counts.get(category.id) ?? 0),
    );
  }

  /** POST /store/categories — create. */
  async createCategory(
    ownerUserId: string,
    storeId: string | undefined,
    input: CreateCategoryInput,
  ): Promise<StoreCategoryView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const category = await this.prisma.storeCategory.create({
      data: {
        storeId: store.id,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        emoji: input.iconOrEmoji,
      },
    });
    return toStoreCategoryView(category, 0);
  }

  /** PUT /store/categories/:id — partial update. */
  async updateCategory(
    ownerUserId: string,
    storeId: string | undefined,
    categoryId: string,
    input: Partial<CreateCategoryInput>,
  ): Promise<StoreCategoryView> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertCategory(store.id, categoryId);

    const category = await this.prisma.storeCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.iconOrEmoji !== undefined ? { emoji: input.iconOrEmoji } : {}),
      },
    });
    const productCount = await this.prisma.product.count({
      where: { storeCategoryId: categoryId },
    });
    return toStoreCategoryView(category, productCount);
  }

  /** DELETE /store/categories/:id — fails 409 unless force unlinks products. */
  async deleteCategory(
    ownerUserId: string,
    storeId: string | undefined,
    categoryId: string,
    force: boolean,
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    await this.assertCategory(store.id, categoryId);

    const linked = await this.prisma.product.count({
      where: { storeCategoryId: categoryId },
    });
    if (linked > 0 && !force) {
      throw ApiError.conflict(
        'CATEGORY_HAS_PRODUCTS',
        `This category has ${linked} linked product(s); pass force=true to unlink them`,
      );
    }
    if (force) {
      // Unlink products first (the relation uses onDelete: SetNull).
      await this.prisma.product.updateMany({
        where: { storeCategoryId: categoryId },
        data: { storeCategoryId: null },
      });
    }
    await this.prisma.storeCategory.delete({ where: { id: categoryId } });
    return null;
  }

  private async assertCategory(storeId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.storeCategory.findFirst({
      where: { id: categoryId, storeId },
      select: { id: true },
    });
    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found in this store');
    }
  }
}
