import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

@Entity('sala_jugadores')
export class RoomPlayer {
  @PrimaryGeneratedColumn({ name: 'id_sala_jugador' })
  idSalaJugador: number;

  @Column({ name: 'sala_id', nullable: true })
  salaId: number;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @Column({
    name: 'estado_preparacion',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  estadoPreparacion: boolean;

  @Column({
    name: 'fecha_ingreso',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaIngreso: Date;

  @ManyToOne(() => Room, (room) => room.jugadores, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sala_id' })
  sala: Room;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
