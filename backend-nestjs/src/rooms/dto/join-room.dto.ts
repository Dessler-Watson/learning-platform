import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Código de acceso de la sala',
    example: 'ABC123',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;
}
