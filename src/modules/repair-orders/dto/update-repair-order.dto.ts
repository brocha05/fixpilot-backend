import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UrgencyLevel } from '@prisma/client';

export class UpdateRepairOrderDto {
  @ApiPropertyOptional({ example: 'Samsung Galaxy S23' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'No carga, conector dañado' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  issueDescription?: string;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Costo estimado (MXN)', example: 800.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  costEstimate?: number;

  @ApiPropertyOptional({
    description: 'Precio final acordado (MXN)',
    example: 950.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  finalPrice?: number;

  @ApiPropertyOptional({
    description: 'Indica si el cliente aprobó la reparación',
  })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
