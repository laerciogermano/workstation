import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Capacidade de slots por máquina (`hostKey` = localhost | IP).
 * Fallback: env `AVD_MAX_ATIVOS_POR_SERVIDOR`.
 */
@Entity('host_config')
export class HostConfig {
  @PrimaryColumn({ name: 'host_key', type: 'varchar', length: 120 })
  hostKey!: string;

  @Column({ name: 'max_ativos', type: 'int', default: 1 })
  maxAtivos!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
