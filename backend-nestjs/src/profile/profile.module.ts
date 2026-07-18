import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User } from '../database/entities/user.entity';
import { Avatar } from '../database/entities/avatar.entity';
import { UserGameProgress } from '../database/entities/user-game-progress.entity';
import { League } from '../database/entities/league.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Avatar, UserGameProgress, League]),
    AuthModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
