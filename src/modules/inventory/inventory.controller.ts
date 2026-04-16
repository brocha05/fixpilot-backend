import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, ListProductsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.inventoryService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListProductsDto) {
    return this.inventoryService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', type: String })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventoryService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar producto (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.remove(user.companyId, id);
  }
}
