import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UrgencyLevel } from '@prisma/client';

export class CreateRepairOrderDto {
  @ApiProperty({ description: 'UUID del cliente', example: 'a1b2c3d4-...' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Modelo del dispositivo', example: 'iPhone 14 Pro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  deviceModel: string;

  @ApiProperty({
    description: 'Descripción del problema reportado',
    example: 'La pantalla está rota y no enciende',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  issueDescription: string;

  @ApiPropertyOptional({
    description: 'Nivel de urgencia',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel = UrgencyLevel.NORMAL;

  @ApiPropertyOptional({
    description: 'Costo estimado de la reparación (MXN)',
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  costEstimate?: number;
}
