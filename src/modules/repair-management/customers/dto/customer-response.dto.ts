import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Customer } from '@prisma/client';

export class CustomerResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'f9e8d7c6-b5a4-3210-fedc-ba0987654321' })
  companyId: string;

  @ApiProperty({ example: 'Juan Pérez García' })
  name: string;

  @ApiProperty({ example: '5512345678' })
  phone: string;

  @ApiPropertyOptional({ example: 'juan.perez@email.com' })
  email: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  static fromEntity(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.companyId = customer.companyId;
    dto.name = customer.name;
    dto.phone = customer.phone;
    dto.email = customer.email ?? null;
    dto.createdAt = customer.createdAt;
    return dto;
  }
}
