import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({
    description: 'Contenido del comentario',
    example: 'Se realizó la limpieza del conector de carga',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({
    description: 'Si es true, el comentario solo es visible para el equipo interno (no al cliente)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  internal?: boolean = false;
}
