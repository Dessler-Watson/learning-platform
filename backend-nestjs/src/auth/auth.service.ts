import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { nombre, correo, contraseña, rol } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { correo },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const user = this.userRepository.create({
      nombre,
      correo,
      contraseña: hashedPassword,
      rol: rol || 'estudiante',
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        id: savedUser.idUsuario,
        nombre: savedUser.nombre,
        correo: savedUser.correo,
        rol: savedUser.rol,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, contraseña } = loginDto;

    const user = await this.userRepository.findOne({
      where: { correo },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado !== 'activo') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.idUsuario,
      correo: user.correo,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
      relations: ['avatar'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.idUsuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      estado: user.estado,
      fechaRegistro: user.fechaRegistro,
      avatar: user.avatar,
    };
  }
}
