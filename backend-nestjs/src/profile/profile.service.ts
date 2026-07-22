import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Avatar } from '../database/entities/avatar.entity';
import { UserGameProgress } from '../database/entities/user-game-progress.entity';
import { League } from '../database/entities/league.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
    @InjectRepository(UserGameProgress)
    private readonly progressRepository: Repository<UserGameProgress>,
    @InjectRepository(League)
    private readonly leagueRepository: Repository<League>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
      relations: ['avatar'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const totalCopas = await this.getTotalCopas(userId);
    const ligaActual = await this.getCurrentLeague(totalCopas);

    return {
      id: user.idUsuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      estado: user.estado,
      fechaRegistro: user.fechaRegistro,
      avatar: user.avatar,
      totalCopas,
      ligaActual,
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateProfileDto.nombre) {
      user.nombre = updateProfileDto.nombre;
    }

    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Perfil actualizado exitosamente',
      user: {
        id: updatedUser.idUsuario,
        nombre: updatedUser.nombre,
        correo: updatedUser.correo,
        rol: updatedUser.rol,
      },
    };
  }

  async selectAvatar(userId: number, avatarId: number) {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const avatar = await this.avatarRepository.findOne({
      where: { idAvatar: avatarId },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar no encontrado');
    }

    if (!avatar.desbloqueado) {
      throw new BadRequestException('El avatar no está desbloqueado');
    }

    user.avatarId = avatarId;
    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Avatar seleccionado exitosamente',
      user: {
        id: updatedUser.idUsuario,
        nombre: updatedUser.nombre,
        avatarId: updatedUser.avatarId,
      },
      avatar,
    };
  }

  async getAvailableAvatars() {
    const avatars = await this.avatarRepository.find({
      where: { desbloqueado: true },
      order: { idAvatar: 'ASC' },
    });

    return avatars;
  }

  async getCurrentLeague(totalCopas: number) {
    const league = await this.leagueRepository
      .createQueryBuilder('liga')
      .where('liga.copas_min <= :totalCopas', { totalCopas })
      .andWhere('liga.copas_max >= :totalCopas', { totalCopas })
      .getOne();

    return league || null;
  }

  async getTotalCopas(userId: number): Promise<number> {
    const result = await this.progressRepository
      .createQueryBuilder('progreso')
      .select('SUM(progreso.copas)', 'total')
      .where('progreso.usuario_id = :userId', { userId })
      .getRawOne();

    return result?.total || 0;
  }

  async getCopas(userId: number) {
    const totalCopas = await this.getTotalCopas(userId);
    const ligaActual = await this.getCurrentLeague(totalCopas);

    const progressByGame = await this.progressRepository.find({
      where: { usuarioId: userId },
      relations: ['liga'],
    });

    return {
      totalCopas,
      ligaActual,
      progresoPorJuego: progressByGame.map((p) => ({
        juegoId: p.juegoId,
        copas: p.copas,
        experiencia: p.experiencia,
        victorias: p.victorias,
        derrotas: p.derrotas,
        racha: p.racha,
        liga: p.liga,
      })),
    };
  }
}
