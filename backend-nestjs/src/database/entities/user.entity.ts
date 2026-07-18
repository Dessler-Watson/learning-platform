import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Avatar } from './avatar.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'avatar_id', nullable: true })
  avatarId: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  correo: string;

  @Column({ name: 'contraseña', type: 'varchar', length: 255 })
  contraseña: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    default: 'estudiante',
  })
  rol: string;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'activo' })
  estado: string;

  @ManyToOne(() => Avatar, { nullable: true })
  @JoinColumn({ name: 'avatar_id' })
  avatar: Avatar;
}
