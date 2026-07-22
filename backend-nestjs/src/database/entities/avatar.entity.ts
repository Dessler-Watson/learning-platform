import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('avatares')
export class Avatar {
  @PrimaryGeneratedColumn({ name: 'id_avatar' })
  idAvatar: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  imagen: string;

  @Column({ type: 'boolean', nullable: true, default: true })
  desbloqueado: boolean;
}
