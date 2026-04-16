import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Sale, SaleItem, Product, Customer } from '@prisma/client';

type SaleWithRelations = Sale & {
  items: (SaleItem & {
    product: Pick<Product, 'id' | 'name' | 'unit' | 'sku'>;
  })[];
  customer?: Pick<Customer, 'id' | 'name' | 'phone'> | null;
};

export class SaleItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiPropertyOptional() productSku: string | null;
  @ApiProperty() productUnit: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() subtotal: number;

  static fromEntity(
    item: SaleItem & { product: Pick<Product, 'id' | 'name' | 'unit' | 'sku'> },
  ): SaleItemResponseDto {
    const dto = new SaleItemResponseDto();
    dto.id = item.id;
    dto.productId = item.productId;
    dto.productName = item.product.name;
    dto.productSku = item.product.sku;
    dto.productUnit = item.product.unit;
    dto.quantity = item.quantity;
    dto.unitPrice = Number(item.unitPrice);
    dto.subtotal = Number(item.subtotal);
    return dto;
  }
}

export class SaleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiPropertyOptional() branchId: string | null;
  @ApiPropertyOptional() customerId: string | null;
  @ApiPropertyOptional() customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  @ApiProperty() totalAmount: number;
  @ApiProperty() discount: number;
  @ApiProperty() finalAmount: number;
  @ApiProperty() paymentMethod: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty({ type: [SaleItemResponseDto] }) items: SaleItemResponseDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  static fromEntity(sale: SaleWithRelations): SaleResponseDto {
    const dto = new SaleResponseDto();
    dto.id = sale.id;
    dto.companyId = sale.companyId;
    dto.branchId = sale.branchId;
    dto.customerId = sale.customerId;
    dto.customer = sale.customer
      ? {
          id: sale.customer.id,
          name: sale.customer.name,
          phone: sale.customer.phone,
        }
      : null;
    dto.totalAmount = Number(sale.totalAmount);
    dto.discount = Number(sale.discount);
    dto.finalAmount = Number(sale.finalAmount);
    dto.paymentMethod = sale.paymentMethod;
    dto.status = sale.status;
    dto.notes = sale.notes;
    dto.items = sale.items.map(SaleItemResponseDto.fromEntity);
    dto.createdAt = sale.createdAt.toISOString();
    dto.updatedAt = sale.updatedAt.toISOString();
    return dto;
  }
}
