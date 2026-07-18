import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectAvatarDto {
  @ApiProperty({
    description: 'ID del avatar a seleccionar',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  avatarId: number;
}
