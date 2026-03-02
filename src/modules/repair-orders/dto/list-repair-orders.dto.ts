import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RepairStatus, UrgencyLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListRepairOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: RepairStatus,
    description: 'Filtrar por estado',
  })
  @IsOptional()
  @IsEnum(RepairStatus)
  status?: RepairStatus;

  @ApiPropertyOptional({
    enum: UrgencyLevel,
    description: 'Filtrar por urgencia',
  })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Filtrar por cliente (UUID)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
