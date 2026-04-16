import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class SaleItemInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID(undefined, { message: 'El ID del producto no es válido' })
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;

  @ApiPropertyOptional({
    example: 1200.0,
    description: 'Precio unitario; si se omite, usa el precio del catálogo',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  unitPrice?: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleItemInputDto] })
  @IsArray({ message: 'Los artículos deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un artículo' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items: SaleItemInputDto[];

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod, { message: 'Método de pago inválido' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 50.0, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'El descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  discount?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID(undefined, { message: 'El ID del cliente no es válido' })
  customerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID(undefined, { message: 'El ID de sucursal no es válido' })
  branchId?: string;

  @ApiPropertyOptional({ example: 'Pago en efectivo, cliente frecuente' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
  notes?: string;
}
