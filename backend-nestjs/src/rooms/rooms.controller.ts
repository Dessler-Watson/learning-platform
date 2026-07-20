import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { ToggleReadyDto } from './dto/toggle-ready.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('Salas')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva sala privada' })
  @ApiResponse({
    status: 201,
    description: 'Sala creada exitosamente con código de acceso',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createRoom(
    @CurrentUser() user: User,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(user.idUsuario, createRoomDto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unirse a una sala con código de acceso' })
  @ApiResponse({ status: 200, description: 'Unido a la sala exitosamente' })
  @ApiResponse({ status: 400, description: 'Sala llena o no en espera' })
  @ApiResponse({ status: 404, description: 'Sala no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya estás en esta sala' })
  async joinRoom(@CurrentUser() user: User, @Body() joinRoomDto: JoinRoomDto) {
    return this.roomsService.joinRoom(user.idUsuario, joinRoomDto.codigo);
  }

  @Delete(':salaId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salir de una sala' })
  @ApiResponse({ status: 200, description: 'Saliste de la sala exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Sala no encontrada o no estás en ella',
  })
  async leaveRoom(
    @CurrentUser() user: User,
    @Param('salaId', ParseIntPipe) salaId: number,
  ) {
    return this.roomsService.leaveRoom(user.idUsuario, salaId);
  }

  @Get(':salaId/players')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar jugadores conectados en una sala' })
  @ApiResponse({ status: 200, description: 'Lista de jugadores en la sala' })
  @ApiResponse({ status: 404, description: 'Sala no encontrada' })
  async getPlayers(@Param('salaId', ParseIntPipe) salaId: number) {
    return this.roomsService.getPlayers(salaId);
  }

  @Put(':salaId/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar estado de preparación del jugador' })
  @ApiResponse({
    status: 200,
    description: 'Estado de preparación actualizado',
  })
  @ApiResponse({ status: 400, description: 'La sala ya no está en espera' })
  @ApiResponse({
    status: 404,
    description: 'Sala no encontrada o no estás en ella',
  })
  async toggleReady(
    @CurrentUser() user: User,
    @Param('salaId', ParseIntPipe) salaId: number,
    @Body() toggleReadyDto: ToggleReadyDto,
  ) {
    return this.roomsService.toggleReady(
      user.idUsuario,
      salaId,
      toggleReadyDto.estadoPreparacion,
    );
  }

  @Get('public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar salas públicas disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de salas públicas en espera',
  })
  async listPublicRooms() {
    return this.roomsService.listPublicRooms();
  }
}
