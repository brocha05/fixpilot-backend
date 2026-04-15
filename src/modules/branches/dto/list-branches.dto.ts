import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListBranchesDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: BranchStatus,
    description: 'Filtrar por estatus',
  })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
