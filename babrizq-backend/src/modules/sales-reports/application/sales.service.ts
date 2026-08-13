/**
 * Sales service — the store owner's delivered-orders ledger (`sales.md`).
 *
 * A "sale" is any order that reached `delivered`. The list endpoint returns
 * the paginated envelope plus a summary computed over the filtered set; the
 * export endpoint renders the same filtered set as a CSV (or Excel-compatible
 * SpreadsheetML for `format=xlsx`, since no binary-XLSX writer is installed).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginated } from '../../../shared/common/pagination/paginated';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** SaleRecord shape (sales.md). */
export interface SaleRecordView {
  id: string;
  orderNumber: string;
  date: string; // YYYY-MM-DD
  customerNameEn: string;
  customerNameAr: string;
  total: number;
  currency: string;
  status: 'delivered';
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
}

export interface SalesListQuery {
  page: number;
  pageSize: number;
  search?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
}

export interface SalesSummaryView {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  byCurrency: { currency: string; amount: number }[];
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /store/sales — paginated delivered orders + summary. */
  async listSales(
    ownerUserId: string,
    storeId: string | undefined,
    query: SalesListQuery,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const where = this.buildWhere(store.id, query);

    const [rows, totalItems, summaryRows] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        select: { id: true, total: true, currency: true },
      }),
    ]);

    const summary = this.buildSummary(summaryRows);
    return {
      ...buildPaginated(
        rows.map((row) => toSaleRecord(row)),
        totalItems,
        query.page,
        query.pageSize,
      ),
      summary,
    };
  }

  /**
   * GET /store/sales/export — returns `{ filename, mime, content }` so the
   * controller can stream the download (bypassing the response envelope).
   */
  async exportSales(
    ownerUserId: string,
    storeId: string | undefined,
    query: SalesListQuery & { format?: 'csv' | 'xlsx' },
  ): Promise<{ filename: string; mime: string; content: string }> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const where = this.buildWhere(store.id, query);
    const rows = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (query.format === 'xlsx') {
      return {
        filename: `sales-${new Date().toISOString().slice(0, 10)}.xlsx`,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        content: this.toSpreadsheetXml(rows),
      };
    }
    return {
      filename: `sales-${new Date().toISOString().slice(0, 10)}.csv`,
      mime: 'text/csv',
      content: this.toCsv(rows),
    };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Delivered-orders filter for the list AND the export (same filters). */
  private buildWhere(storeId: string, query: SalesListQuery): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = { storeId, status: 'delivered' };
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customerNameEn: { contains: query.search } },
        { customerNameAr: { contains: query.search } },
      ];
    }
    if (query.currency) where.currency = query.currency;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      const total: Prisma.FloatFilter = {};
      if (query.minAmount !== undefined) total.gte = query.minAmount;
      if (query.maxAmount !== undefined) total.lte = query.maxAmount;
      where.total = total;
    }
    if (query.fromDate || query.toDate) {
      const orderDate: Prisma.DateTimeFilter = {};
      if (query.fromDate) orderDate.gte = new Date(`${query.fromDate}T00:00:00.000Z`);
      if (query.toDate) orderDate.lte = new Date(`${query.toDate}T23:59:59.999Z`);
      where.orderDate = orderDate;
    }
    return where;
  }

  private buildSummary(rows: { total: number; currency: string }[]): SalesSummaryView {
    const totalRevenue = round2(rows.reduce((sum, row) => sum + row.total, 0));
    const byCurrency = new Map<string, number>();
    for (const row of rows) {
      byCurrency.set(row.currency, round2((byCurrency.get(row.currency) ?? 0) + row.total));
    }
    return {
      totalRevenue,
      totalOrders: rows.length,
      avgOrderValue: rows.length ? round2(totalRevenue / rows.length) : 0,
      byCurrency: [...byCurrency.entries()].map(([currency, amount]) => ({ currency, amount })),
    };
  }

  private toCsv(rows: Parameters<typeof toSaleRecord>[0][]): string {
    const header = 'Order,Customer,Date,Amount,Currency,Status';
    const lines = rows.map((row) => {
      const customer = row.customerNameEn.includes(',')
        ? `"${row.customerNameEn}"`
        : row.customerNameEn;
      return [row.orderNumber, customer, row.orderDate.toISOString().slice(0, 10),
        row.total.toFixed(2), row.currency, 'delivered'].join(',');
    });
    return [header, ...lines].join('\r\n');
  }

  /** Minimal Excel-compatible SpreadsheetML 2003 document (Excel opens it). */
  private toSpreadsheetXml(rows: Parameters<typeof toSaleRecord>[0][]): string {
    const esc = (value: string): string =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = rows
      .map((row) => {
        const cells = [
          row.orderNumber,
          row.customerNameEn,
          row.orderDate.toISOString().slice(0, 10),
          row.total.toFixed(2),
          row.currency,
          'delivered',
        ]
          .map((cell) => `<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`)
          .join('');
        return `<Row>${cells}</Row>`;
      })
      .join('');
    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sales">
<Table>
<Row>
<Cell><Data ss:Type="String">Order</Data></Cell>
<Cell><Data ss:Type="String">Customer</Data></Cell>
<Cell><Data ss:Type="String">Date</Data></Cell>
<Cell><Data ss:Type="String">Amount</Data></Cell>
<Cell><Data ss:Type="String">Currency</Data></Cell>
<Cell><Data ss:Type="String">Status</Data></Cell>
</Row>
${body}
</Table>
</Worksheet>
</Workbook>`;
  }
}

/** Maps a stored order row to the SaleRecord view. */
function toSaleRecord(row: {
  id: string;
  orderNumber: string;
  orderDate: Date;
  customerNameEn: string;
  customerNameAr: string;
  total: number;
  currency: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
}): SaleRecordView {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    date: row.orderDate.toISOString().slice(0, 10),
    customerNameEn: row.customerNameEn,
    customerNameAr: row.customerNameAr,
    total: row.total,
    currency: row.currency,
    status: 'delivered',
    items: row.items.map((item) => ({
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      qty: item.qty,
      price: item.price,
    })),
  };
}
