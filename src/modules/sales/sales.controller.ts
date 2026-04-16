import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { SalesService } from './sales.service';
import { CreateSaleDto, ListSalesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces';

@ApiTags('Sales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar venta' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.companyId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListSalesDto) {
    return this.salesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesService.findOne(user.companyId, id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar venta (restaura stock)' })
  @ApiParam({ name: 'id', type: String })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesService.cancel(user.companyId, id);
  }
}
