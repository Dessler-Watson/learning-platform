import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nombre visible del usuario',
    example: 'Juan Pérez',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;
}
