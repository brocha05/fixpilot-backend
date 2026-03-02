import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => (value as string).trim())
  name: string;

  @ApiProperty({
    description: 'Teléfono del cliente (10 dígitos)',
    example: '5512345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del cliente (opcional)',
    example: 'juan.perez@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Transform(({ value }) => (value as string | undefined)?.toLowerCase().trim())
  email?: string;
}
