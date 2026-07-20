import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    description: 'ID del juego asociado a la sala',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  juegoId: number;

  @ApiProperty({
    description: 'Tipo de sala (publica o privada)',
    example: 'privada',
    required: false,
  })
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiProperty({
    description: 'Número máximo de jugadores (1-8)',
    example: 8,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(8)
  maxJugadores?: number;
}
