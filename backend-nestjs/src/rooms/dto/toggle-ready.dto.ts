import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleReadyDto {
  @ApiProperty({
    description: 'Estado de preparación del jugador',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  estadoPreparacion: boolean;
}
