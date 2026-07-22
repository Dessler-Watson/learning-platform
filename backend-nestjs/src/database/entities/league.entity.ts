import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ligas')
export class League {
  @PrimaryGeneratedColumn({ name: 'id_liga' })
  idLiga: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'copas_min', type: 'int' })
  copasMin: number;

  @Column({ name: 'copas_max', type: 'int' })
  copasMax: number;
}
