/**
 * Store context — resolves and verifies the `X-Store-Id` header used by
 * every store-owner endpoint (per the store-owner `_shared.md` contract).
 *
 * The store must exist AND belong to the authenticated store-owner, so a
 * user can never manage another owner's store.
 */
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';

export async function resolveOwnedStore(
  prisma: PrismaService,
  ownerUserId: string,
  storeId: string | undefined,
): Promise<{ id: string }> {
  if (!storeId) {
    throw ApiError.badRequest('STORE_ID_REQUIRED', 'X-Store-Id header is required');
  }
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, ownerUserId: true },
  });
  if (!store) {
    throw ApiError.notFound('STORE_NOT_FOUND', `Store "${storeId}" not found`);
  }
  if (store.ownerUserId !== ownerUserId) {
    throw ApiError.conflict('STORE_NOT_OWNED', 'You do not own this store');
  }
  return store;
}
