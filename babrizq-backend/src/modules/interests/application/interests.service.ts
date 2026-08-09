/**
 * Interests application service — server-side interest tracking and
 * personalized recommendations (customer `recommendations.md`).
 *
 * The server keeps up to `MAX_INTERESTS` (15) categories per customer,
 * most recent first (`lastSeenAt`). Duplicate categories are moved to the
 * front rather than appended. The track endpoint is fire-and-forget: unknown
 * categories are silently ignored.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductView, toProductView } from '../../storefront/application/storefront.mapper';

/** Maximum interest categories kept per customer (client contract: 15). */
const MAX_INTERESTS = 15;
/** Categories used for recommendations (client contract: top 3). */
const RECOMMENDATION_CATEGORIES = 3;

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /customer/interests — record (or bump) a category interest. */
  async trackInterest(customerUserId: string, categoryEn: string): Promise<null> {
    const category = await this.prisma.platformCategory.findUnique({
      where: { code: categoryEn },
      select: { code: true },
    });
    // Unknown categories are a no-op (the client swallows failures anyway).
    if (!category) return null;

    await this.prisma.customerInterest.upsert({
      where: {
        customerUserId_categoryCode: { customerUserId, categoryCode: categoryEn },
      },
      create: { customerUserId, categoryCode: categoryEn },
      update: { lastSeenAt: new Date() },
    });

    await this.prune(customerUserId);
    return null;
  }

  /** GET /customer/recommendations — products from the top interest categories. */
  async getRecommendations(
    customerUserId: string,
    limit: number,
  ): Promise<{ products: ProductView[]; basedOnCategories: string[] }> {
    const interests = await this.prisma.customerInterest.findMany({
      where: { customerUserId },
      orderBy: { lastSeenAt: 'desc' },
      take: RECOMMENDATION_CATEGORIES,
      select: { categoryCode: true },
    });
    const basedOnCategories = interests.map((i) => i.categoryCode);
    if (basedOnCategories.length === 0) {
      return { products: [], basedOnCategories };
    }

    const products = await this.prisma.product.findMany({
      where: { status: 'active', categoryCode: { in: basedOnCategories } },
      include: { store: true, category: true, tags: true },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return { products: products.map(toProductView), basedOnCategories };
  }

  /** Keeps only the most recent `MAX_INTERESTS` rows for the customer. */
  private async prune(customerUserId: string): Promise<void> {
    const latest = await this.prisma.customerInterest.findMany({
      where: { customerUserId },
      orderBy: { lastSeenAt: 'desc' },
      take: MAX_INTERESTS,
      select: { id: true },
    });
    if (latest.length < MAX_INTERESTS) return;

    await this.prisma.customerInterest.deleteMany({
      where: { customerUserId, id: { notIn: latest.map((i) => i.id) } },
    });
  }
}
