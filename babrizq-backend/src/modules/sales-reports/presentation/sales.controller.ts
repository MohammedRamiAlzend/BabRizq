/**
 * Sales controller — `/api/store/sales` (store-owner `sales.md`).
 * List returns the paginated envelope + summary; export streams a raw file
 * (CSV / Excel-compatible XML) bypassing the response envelope.
 */
import {
  Controller,
  Get,
  Headers,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { SkipApiResponse } from '../../../shared/common/decorators/skip-api-response.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { SalesService } from '../application/sales.service';
import { ExportSalesQueryDto, ListSalesQueryDto } from './dto/sales-reports.dto';

@ApiTags('Store Owner Sales')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List delivered orders (sales) with summary statistics' })
  listSales(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ListSalesQueryDto,
  ) {
    return this.sales.listSales(user.sub, storeId, query);
  }

  @Get('export')
  @SkipApiResponse()
  @ApiOperation({ summary: 'Download the filtered sales as CSV or XLSX' })
  async exportSales(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Query() query: ExportSalesQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.sales.exportSales(user.sub, storeId, query);
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.content);
  }
}
