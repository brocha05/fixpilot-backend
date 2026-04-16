import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListProductsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estatus inválido' })
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filtrar solo productos con stock bajo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ example: 'Pantallas' })
  @IsOptional()
  category?: string;
}
