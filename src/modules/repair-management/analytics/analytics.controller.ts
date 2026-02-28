import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces';

class PeriodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen del dashboard (mes actual)' })
  getDashboardSummary(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardSummary(user.companyId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Métricas de ingresos por período' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  @ApiQuery({ name: 'month', required: false, example: 6 })
  getRevenue(@CurrentUser() user: JwtPayload, @Query() period: PeriodQueryDto) {
    const year = period.year ?? new Date().getFullYear();
    return this.analyticsService.getRevenueSummary(user.companyId, year, period.month);
  }

  @Get('repairs')
  @ApiOperation({ summary: 'Estadísticas de reparaciones (totales, por estatus, tiempo promedio)' })
  getRepairStats(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getRepairStats(user.companyId);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Resumen de gastos por período y categoría' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  @ApiQuery({ name: 'month', required: false, example: 6 })
  getExpenses(@CurrentUser() user: JwtPayload, @Query() period: PeriodQueryDto) {
    const year = period.year ?? new Date().getFullYear();
    return this.analyticsService.getExpenseSummary(user.companyId, year, period.month);
  }
}
