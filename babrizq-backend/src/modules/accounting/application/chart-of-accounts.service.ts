/**
 * Chart-of-accounts service — ensures every store has the KSA-standard
 * ledger accounts (idempotent seed on first use) and resolves account codes
 * to stored account rows.
 */
import { Injectable } from '@nestjs/common';
import { LedgerAccount, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCOUNT_TEMPLATE } from './account-codes';

@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the template accounts exist for the store (no-op after the first
   * call). Runs inside the caller's transaction when `tx` is provided so the
   * seed is atomic with the first posting.
   */
  async ensureChartOfAccounts(
    storeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount[]> {
    const client = tx ?? this.prisma;
    const existing = await client.ledgerAccount.count({ where: { storeId } });
    if (existing > 0) return client.ledgerAccount.findMany({ where: { storeId } });

    await client.ledgerAccount.createMany({
      data: ACCOUNT_TEMPLATE.map((account) => ({
        storeId,
        code: account.code,
        nameEn: account.nameEn,
        nameAr: account.nameAr,
        type: account.type,
        isSystem: true,
        openingBalance: 0,
      })),
    });
    return client.ledgerAccount.findMany({ where: { storeId } });
  }

  /** Resolves the stored account row for a code (or null). */
  async findAccount(
    storeId: string,
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount | null> {
    const client = tx ?? this.prisma;
    return client.ledgerAccount.findUnique({
      where: { storeId_code: { storeId, code } },
    });
  }

  /** Lists the store's chart of accounts (trial-balance input). */
  listAccounts(storeId: string) {
    return this.prisma.ledgerAccount.findMany({
      where: { storeId },
      orderBy: { code: 'asc' },
    });
  }
}
