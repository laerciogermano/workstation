import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Servidor } from '../servidores/servidor.entity';

/** Status operacional do container no host. */
export type AvdStatus = 'ativo' | 'dormindo' | 'criando' | 'erro';

/**
 * AVD (docker-avd) em um servidor — container `docker-avd-<slug>`.
 * Estado do device: `/android-home` (backup tar em AVD_ARTIFACTS_DIR).
 */
@Entity('avds')
@Index(['servidorId', 'nome'], { unique: true })
export class Avd {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nome lógico do agent (ex.: agent-d). */
  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ name: 'servidor_id', type: 'uuid' })
  servidorId!: string;

  @ManyToOne(() => Servidor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servidor_id' })
  servidor!: Servidor;

  /** Nome do container Docker. */
  @Column({ name: 'container_name', type: 'varchar', length: 160 })
  containerName!: string;

  /** Imagem base do emulador. */
  @Column({ type: 'varchar', length: 400 })
  image!: string;

  /** Porta ADB no host (127.0.0.1:adbPort → 5555). */
  @Column({ name: 'adb_port', type: 'int' })
  adbPort!: number;

  /** Serial ADB local no host (`127.0.0.1:adbPort`). */
  @Column({ type: 'varchar', length: 64 })
  serial!: string;

  /** ativo | dormindo | criando | erro */
  @Column({ type: 'varchar', length: 32, default: 'dormindo' })
  status!: AvdStatus;

  /** Último path de backup tar no servidor. */
  @Column({ name: 'last_backup_path', type: 'varchar', length: 500, nullable: true })
  lastBackupPath!: string | null;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
