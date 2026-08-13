/**
 * Accounting controller — store-owner accounting suite (P1 "live books").
 * Every endpoint requires the `store_owner` role and an owned `X-Store-Id`
 * header (same contract as the rest of the store-owner module).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { ChartOfAccountsService } from '../application/chart-of-accounts.service';
import { ExpensesService } from '../application/expenses.service';
import { InvoicesService } from '../application/invoices.service';
import { LedgerPostingService } from '../application/ledger-posting.service';
import { StatementsService } from '../application/statements.service';
import {
  CreateExpenseDto,
  JournalQueryDto,
  LedgerQueryDto,
  ListExpensesQueryDto,
  PeriodQueryDto,
  TrialBalanceQueryDto,
} from './dto/accounting.dto';
import { CreateManualInvoiceDto } from './dto/invoices.dto';

@ApiTags('Store Owner Accounting')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/accounting')
export class AccountingController {
  constructor(
    private readonly chart: ChartOfAccountsService,
    private readonly statements: StatementsService,
    private readonly expenses: ExpensesService,
    private readonly invoices: InvoicesService,
    private readonly posting: LedgerPostingService,
  ) {}

  // ---- Chart of accounts ----

  @Get('accounts')
  @ApiOperation({ summary: 'Chart of accounts (seeded KSA template)' })
  listAccounts(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.statements.trialBalanceForStore(user.sub, storeId);
  }

  // ---- Statements ----

  @Get('summary')
  @ApiOperation({ summary: 'Accounting summary: revenue, profit, tax due, receivables' })
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.statements.summary(user.sub, storeId);
  }

  @Get('pnl')
  @ApiOperation({ summary: 'Profit & loss for a period (+ previous-period comparison)' })
  getPnl(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: PeriodQueryDto,
  ) {
    return this.statements.pnlForStore(user.sub, storeId, query);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial balance at a date (debits must equal credits)' })
  getTrialBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: TrialBalanceQueryDto,
  ) {
    return this.statements.trialBalanceForStore(user.sub, storeId, query.at);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'General-ledger drill-down for one account' })
  getLedger(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: LedgerQueryDto,
  ) {
    return this.statements.ledgerForStore(user.sub, storeId, query);
  }

  @Get('journals')
  @ApiOperation({ summary: 'Journal audit trail (paginated)' })
  getJournals(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: JournalQueryDto,
  ) {
    return this.statements.journalsForStore(user.sub, storeId, query);
  }

  // ---- Expenses ----

  @Post('expenses')
  @ApiOperation({ summary: 'Record an expense (auto-posts DR expense / CR cash)' })
  createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenses.createExpenseForStore(user.sub, storeId, dto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses (paginated, filter by category)' })
  listExpenses(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListExpensesQueryDto,
  ) {
    return this.expenses.listExpensesForStore(user.sub, storeId, query);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense (reverses its journal entry)' })
  deleteExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Param('id') expenseId: string,
  ): Promise<null> {
    return this.expenses.deleteExpenseForStore(user.sub, storeId, expenseId);
  }

  // ---- Invoices ----

  @Get('invoices')
  @ApiOperation({ summary: 'Tax invoices issued by this store (newest first)' })
  listInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: JournalQueryDto,
  ) {
    return this.invoices.listInvoicesForStore(user.sub, storeId, query);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create a manual invoice linked to an order' })
  createManualInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: CreateManualInvoiceDto,
  ) {
    return this.invoices.createManualInvoice(user.sub, storeId, dto);
  }
}
