import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RepairStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: RepairStatus,
    example: RepairStatus.DIAGNOSED,
  })
  @IsEnum(RepairStatus)
  status: RepairStatus;

  @ApiPropertyOptional({
    description: 'Nota interna sobre el cambio de estado',
    example: 'Se diagnosticó falla en la batería',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
