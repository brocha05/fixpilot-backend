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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ListExpensesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces';

@ApiTags('Gastos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo gasto' })
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: JwtPayload) {
    return this.expensesService.create(dto, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar gastos con filtros opcionales' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListExpensesDto) {
    return this.expensesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gasto por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.findById(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un gasto' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.update(id, dto, user.companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un gasto' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.remove(id, user.companyId);
  }
}
