import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { RoomPlayer } from './room-player.entity';

@Entity('salas')
export class Room {
  @PrimaryGeneratedColumn({ name: 'id_sala' })
  idSala: number;

  @Column({ name: 'juego_id', nullable: true })
  juegoId: number;

  @Column({ name: 'creador_id', nullable: true })
  creadorId: number;

  @Column({ type: 'varchar', nullable: true })
  codigo: string;

  @Column({ type: 'varchar', nullable: true, default: 'publica' })
  tipo: string;

  @Column({ type: 'varchar', nullable: true, default: 'esperando' })
  estado: string;

  @Column({ name: 'max_jugadores', type: 'int', nullable: true, default: 8 })
  maxJugadores: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creador_id' })
  creador: User;

  @OneToMany(() => RoomPlayer, (rp) => rp.sala)
  jugadores: RoomPlayer[];
}
