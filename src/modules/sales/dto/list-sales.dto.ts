import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { SaleStatus, PaymentMethod } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListSalesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus, { message: 'Estatus inválido' })
  status?: SaleStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Método de pago inválido' })
  paymentMethod?: PaymentMethod;
}
