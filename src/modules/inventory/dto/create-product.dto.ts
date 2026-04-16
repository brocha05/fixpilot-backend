import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Pantalla iPhone 13' })
  @IsString({ message: 'El nombre es requerido' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Pantalla OLED original para iPhone 13' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ example: 'PANT-IP13' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El SKU no puede exceder 100 caracteres' })
  sku?: string;

  @ApiPropertyOptional({ example: 'Pantallas' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  category?: string;

  @ApiProperty({ example: 1200.0 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiPropertyOptional({ example: 800.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El costo debe ser un número' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  cost?: number;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @ApiPropertyOptional({ example: 3, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  minStock?: number;

  @ApiPropertyOptional({ example: 'pza', default: 'pza' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'La unidad no puede exceder 20 caracteres' })
  unit?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estatus inválido' })
  status?: ProductStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID(undefined, { message: 'El ID de sucursal no es válido' })
  branchId?: string;
}
