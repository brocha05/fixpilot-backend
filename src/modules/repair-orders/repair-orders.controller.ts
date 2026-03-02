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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { RepairOrdersService } from './repair-orders.service';
import {
  CreateRepairOrderDto,
  UpdateRepairOrderDto,
  ChangeStatusDto,
  AddCommentDto,
  ListRepairOrdersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces';

@ApiTags('Órdenes de Reparación')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('repair-orders')
export class RepairOrdersController {
  constructor(private readonly repairOrdersService: RepairOrdersService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva orden de reparación' })
  create(@Body() dto: CreateRepairOrderDto, @CurrentUser() user: JwtPayload) {
    return this.repairOrdersService.create(dto, user.companyId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes con filtros y paginación' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filters: ListRepairOrdersDto,
  ) {
    return this.repairOrdersService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Obtener detalle completo de una orden (con historial, comentarios e imágenes)',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.findById(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos generales de la orden' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRepairOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.update(id, dto, user.companyId);
  }

  // ─── Status transition ─────────────────────────────────────────────────────

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Cambiar estado de la orden (aplica reglas de transición estrictas)',
  })
  @ApiParam({ name: 'id', type: String })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.changeStatus(
      id,
      dto,
      user.companyId,
      user.sub,
    );
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar un comentario a la orden (puede ser interno o público)',
  })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.addComment(
      id,
      dto,
      user.companyId,
      user.sub,
    );
  }

  // ─── Images ────────────────────────────────────────────────────────────────

  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asociar una imagen (fileKey S3) a la orden' })
  @ApiBody({
    schema: {
      properties: { fileKey: { type: 'string' } },
      required: ['fileKey'],
    },
  })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('fileKey') fileKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.addImage(id, fileKey, user.companyId);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una imagen de la orden' })
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairOrdersService.removeImage(id, imageId, user.companyId);
  }
}
