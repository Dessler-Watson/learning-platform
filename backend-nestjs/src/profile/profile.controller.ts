import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SelectAvatarDto } from './dto/select-avatar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('Perfil')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfil completo del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario con avatar y estadísticas',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getProfile(@CurrentUser() user: User) {
    return this.profileService.getProfile(user.idUsuario);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar nombre visible del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.idUsuario, updateProfileDto);
  }

  @Put('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seleccionar avatar del usuario' })
  @ApiResponse({ status: 200, description: 'Avatar seleccionado exitosamente' })
  @ApiResponse({ status: 400, description: 'Avatar no desbloqueado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario o avatar no encontrado' })
  async selectAvatar(
    @CurrentUser() user: User,
    @Body() selectAvatarDto: SelectAvatarDto,
  ) {
    return this.profileService.selectAvatar(
      user.idUsuario,
      selectAvatarDto.avatarId,
    );
  }

  @Get('avatars')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener lista de avatares disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de avatares desbloqueados' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAvailableAvatars() {
    return this.profileService.getAvailableAvatars();
  }

  @Get('copas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener copas totales y liga actual del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de copas y liga actual',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getCopas(@CurrentUser() user: User) {
    return this.profileService.getCopas(user.idUsuario);
  }
}
