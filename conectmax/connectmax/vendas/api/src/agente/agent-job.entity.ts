import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AgentJobStatus, AgentJobType } from './agent-job-types';

@Entity('agent_jobs')
@Index(['agentId', 'status', 'priority'])
@Index(['agentId', 'type', 'status'])
export class AgentJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Mesmo id do AVD / provision.name (ex.: agent-d). */
  @Index()
  @Column({ name: 'agent_id', type: 'varchar', length: 120 })
  agentId!: string;

  /** ler_mensagens | verificar_conexoes | enviar_prospeccao | conectar | extrair_leads */
  @Column({ type: 'varchar', length: 40 })
  type!: AgentJobType;

  /** 1 = mais urgente … 4 = menos. */
  @Column({ type: 'smallint' })
  priority!: number;

  /** pending | claimed | done | failed | cancelled */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: AgentJobStatus;

  /**
   * Dados para o worker: profileUrl, connectionId, clienteLinkedinId, query…
   */
  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  /** Dedupe: ex. `conectar:<connectionId>`. */
  @Index({ unique: true, where: "dedupe_key IS NOT NULL" })
  @Column({ name: 'dedupe_key', type: 'varchar', length: 200, nullable: true })
  dedupeKey!: string | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
