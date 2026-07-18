import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';

@Entity('progreso_usuario_juego')
export class UserGameProgress {
  @PrimaryGeneratedColumn({ name: 'id_progreso' })
  idProgreso: number;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @Column({ name: 'juego_id', nullable: true })
  juegoId: number;

  @Column({ name: 'liga_id', nullable: true })
  ligaId: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  experiencia: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  copas: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  victorias: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  derrotas: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  racha: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => League, { nullable: true })
  @JoinColumn({ name: 'liga_id' })
  liga: League;
}
