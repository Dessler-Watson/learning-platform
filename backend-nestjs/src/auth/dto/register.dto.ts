import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({
    description:
      'Contraseña del usuario (mínimo 8 caracteres, debe incluir números y letras)',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'La contraseña debe tener al menos 8 caracteres, incluir letras y números',
  })
  contraseña: string;

  @ApiProperty({
    description: 'Rol del usuario (opcional, por defecto es estudiante)',
    example: 'estudiante',
    required: false,
  })
  @IsString()
  rol?: string;
}
