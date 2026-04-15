import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BranchStatus } from '@prisma/client';

export class CreateBranchDto {
  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Teléfono de la sucursal (10 dígitos)',
    example: '5512345678',
  })
  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de la sucursal',
    example: 'centro@empresa.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Transform(({ value }) => (value as string | undefined)?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'Dirección de la sucursal',
    example: 'Av. Insurgentes 123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  @Transform(({ value }) => (value as string).trim())
  address: string;

  @ApiProperty({ description: 'Ciudad', example: 'Ciudad de México' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  city: string;

  @ApiProperty({ description: 'Estado', example: 'CDMX' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  state: string;

  @ApiPropertyOptional({ description: 'Código postal', example: '06600' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'País (código ISO 2)',
    example: 'MX',
    default: 'MX',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({ enum: BranchStatus, default: BranchStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @ApiPropertyOptional({
    description: 'Marcar como sucursal principal',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({
    description: 'Notas internas sobre la sucursal',
    example: 'Horario: L-V 9-18h',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (value as string | undefined)?.trim())
  notes?: string;
}
