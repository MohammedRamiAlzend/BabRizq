/**
 * Accounting module — the "accountant-in-a-box" (P1: live books).
 *
 * Every order and expense auto-posts a balanced double-entry journal entry;
 * reports (P&L, trial balance, ledger, journal) are read back from the
 * ledger. Exported so the orders module can post checkout entries inside the
 * same transaction.
 */
import { Module } from '@nestjs/common';
import { AccountingController } from './presentation/accounting.controller';
import { ChartOfAccountsService } from './application/chart-of-accounts.service';
import { ExpensesService } from './application/expenses.service';
import { InvoicesService } from './application/invoices.service';
import { LedgerPostingService } from './application/ledger-posting.service';
import { StatementsService } from './application/statements.service';

@Module({
  controllers: [AccountingController],
  providers: [
    ChartOfAccountsService,
    InvoicesService,
    LedgerPostingService,
    StatementsService,
    ExpensesService,
  ],
  exports: [LedgerPostingService, ChartOfAccountsService, InvoicesService],
})
export class AccountingModule {}
