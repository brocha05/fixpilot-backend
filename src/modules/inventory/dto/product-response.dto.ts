import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Product } from '@prisma/client';

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiPropertyOptional() branchId: string | null;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() sku: string | null;
  @ApiPropertyOptional() category: string | null;
  @ApiProperty() price: number;
  @ApiProperty() cost: number;
  @ApiProperty() stock: number;
  @ApiProperty() minStock: number;
  @ApiProperty() unit: string;
  @ApiProperty() status: string;
  @ApiProperty() isLowStock: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.companyId = product.companyId;
    dto.branchId = product.branchId;
    dto.name = product.name;
    dto.description = product.description;
    dto.sku = product.sku;
    dto.category = product.category;
    dto.price = Number(product.price);
    dto.cost = Number(product.cost);
    dto.stock = product.stock;
    dto.minStock = product.minStock;
    dto.unit = product.unit;
    dto.status = product.status;
    dto.isLowStock = product.stock <= product.minStock;
    dto.createdAt = product.createdAt.toISOString();
    dto.updatedAt = product.updatedAt.toISOString();
    return dto;
  }
}
