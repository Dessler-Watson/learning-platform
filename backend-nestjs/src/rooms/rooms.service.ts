import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../database/entities/room.entity';
import { RoomPlayer } from '../database/entities/room-player.entity';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomPlayer)
    private readonly roomPlayerRepository: Repository<RoomPlayer>,
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom(userId: number, createRoomDto: CreateRoomDto) {
    const { juegoId, tipo, maxJugadores } = createRoomDto;

    let codigo: string;
    let codeExists = true;
    while (codeExists) {
      codigo = this.generateCode();
      const existing = await this.roomRepository.findOne({ where: { codigo } });
      codeExists = !!existing;
    }

    const room = this.roomRepository.create({
      juegoId,
      creadorId: userId,
      codigo,
      tipo: tipo || 'privada',
      estado: 'esperando',
      maxJugadores: maxJugadores || 8,
    });

    const savedRoom = await this.roomRepository.save(room);

    const player = this.roomPlayerRepository.create({
      salaId: savedRoom.idSala,
      usuarioId: userId,
      estadoPreparacion: false,
    });
    await this.roomPlayerRepository.save(player);

    return {
      message: 'Sala creada exitosamente',
      sala: {
        id: savedRoom.idSala,
        codigo: savedRoom.codigo,
        tipo: savedRoom.tipo,
        estado: savedRoom.estado,
        juegoId: savedRoom.juegoId,
        maxJugadores: savedRoom.maxJugadores,
        creadorId: savedRoom.creadorId,
      },
    };
  }

  async joinRoom(userId: number, codigo: string) {
    const room = await this.roomRepository.findOne({
      where: { codigo },
      relations: ['jugadores', 'jugadores.usuario'],
    });

    if (!room) {
      throw new NotFoundException('Sala no encontrada con ese código');
    }

    if (room.estado !== 'esperando') {
      throw new BadRequestException('La sala ya no está en espera');
    }

    const currentPlayers = await this.roomPlayerRepository.count({
      where: { salaId: room.idSala },
    });

    if (currentPlayers >= room.maxJugadores) {
      throw new BadRequestException('La sala está llena');
    }

    const existingPlayer = await this.roomPlayerRepository.findOne({
      where: { salaId: room.idSala, usuarioId: userId },
    });

    if (existingPlayer) {
      throw new ConflictException('Ya estás en esta sala');
    }

    const player = this.roomPlayerRepository.create({
      salaId: room.idSala,
      usuarioId: userId,
      estadoPreparacion: false,
    });
    await this.roomPlayerRepository.save(player);

    return {
      message: 'Te uniste a la sala exitosamente',
      sala: {
        id: room.idSala,
        codigo: room.codigo,
        tipo: room.tipo,
        estado: room.estado,
        juegoId: room.juegoId,
        maxJugadores: room.maxJugadores,
      },
    };
  }

  async leaveRoom(userId: number, salaId: number) {
    const room = await this.roomRepository.findOne({
      where: { idSala: salaId },
    });

    if (!room) {
      throw new NotFoundException('Sala no encontrada');
    }

    const player = await this.roomPlayerRepository.findOne({
      where: { salaId, usuarioId: userId },
    });

    if (!player) {
      throw new NotFoundException('No estás en esta sala');
    }

    await this.roomPlayerRepository.remove(player);

    if (room.creadorId === userId) {
      const remainingPlayers = await this.roomPlayerRepository.find({
        where: { salaId },
        order: { fechaIngreso: 'ASC' },
      });

      if (remainingPlayers.length > 0) {
        room.creadorId = remainingPlayers[0].usuarioId;
        await this.roomRepository.save(room);
      } else {
        await this.roomRepository.remove(room);
        return { message: 'Sala eliminada (estabas solo)' };
      }
    }

    return { message: 'Saliste de la sala exitosamente' };
  }

  async getPlayers(salaId: number) {
    const room = await this.roomRepository.findOne({
      where: { idSala: salaId },
    });

    if (!room) {
      throw new NotFoundException('Sala no encontrada');
    }

    const players = await this.roomPlayerRepository.find({
      where: { salaId },
      relations: ['usuario'],
      order: { fechaIngreso: 'ASC' },
    });

    return {
      sala: {
        id: room.idSala,
        codigo: room.codigo,
        tipo: room.tipo,
        estado: room.estado,
        juegoId: room.juegoId,
        maxJugadores: room.maxJugadores,
        creadorId: room.creadorId,
      },
      jugadores: players.map((p) => ({
        id: p.usuario.idUsuario,
        nombre: p.usuario.nombre,
        avatar: p.usuario.avatarId,
        estadoPreparacion: p.estadoPreparacion,
        esCreador: p.usuarioId === room.creadorId,
        fechaIngreso: p.fechaIngreso,
      })),
      totalJugadores: players.length,
    };
  }

  async toggleReady(
    userId: number,
    salaId: number,
    estadoPreparacion: boolean,
  ) {
    const room = await this.roomRepository.findOne({
      where: { idSala: salaId },
    });

    if (!room) {
      throw new NotFoundException('Sala no encontrada');
    }

    if (room.estado !== 'esperando') {
      throw new BadRequestException('La sala ya no está en espera');
    }

    const player = await this.roomPlayerRepository.findOne({
      where: { salaId, usuarioId: userId },
    });

    if (!player) {
      throw new NotFoundException('No estás en esta sala');
    }

    player.estadoPreparacion = estadoPreparacion;
    await this.roomPlayerRepository.save(player);

    return {
      message: estadoPreparacion ? 'Estás listo' : 'Ya no estás listo',
      estadoPreparacion: player.estadoPreparacion,
    };
  }

  async listPublicRooms() {
    const rooms = await this.roomRepository.find({
      where: { tipo: 'publica', estado: 'esperando' },
      relations: ['jugadores'],
      order: { idSala: 'DESC' },
    });

    const roomsWithCount = [];
    for (const room of rooms) {
      const playerCount = await this.roomPlayerRepository.count({
        where: { salaId: room.idSala },
      });
      roomsWithCount.push({
        id: room.idSala,
        codigo: room.codigo,
        juegoId: room.juegoId,
        maxJugadores: room.maxJugadores,
        jugadoresActuales: playerCount,
        estado: room.estado,
      });
    }

    return roomsWithCount;
  }
}
