import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Estado leve do agente para o loop (inbox sync, job atual).
 */
@Entity('agent_runtime')
export class AgentRuntime {
  @PrimaryColumn({ name: 'agent_id', type: 'varchar', length: 120 })
  agentId!: string;

  /** idle | busy */
  @Column({ type: 'varchar', length: 20, default: 'idle' })
  status!: string;

  @Column({ name: 'current_job_id', type: 'uuid', nullable: true })
  currentJobId!: string | null;

  /** Última vez que rodou AC-01 (ler mensagens / inbox). */
  @Column({ name: 'last_inbox_at', type: 'timestamptz', nullable: true })
  lastInboxAt!: Date | null;

  /** Última vez que listou conexões recentes → mark-accepted (pending→2). */
  @Column({ name: 'last_connections_at', type: 'timestamptz', nullable: true })
  lastConnectionsAt!: Date | null;

  /** Última vez que completou/falhou `enviar_prospeccao` (cooldown entre envios). */
  @Column({ name: 'last_prospeccao_at', type: 'timestamptz', nullable: true })
  lastProspeccaoAt!: Date | null;

  @Column({ name: 'last_claim_at', type: 'timestamptz', nullable: true })
  lastClaimAt!: Date | null;

  /** Último heartbeat do agent-worker (presença). */
  @Column({ name: 'last_heartbeat_at', type: 'timestamptz', nullable: true })
  lastHeartbeatAt!: Date | null;

  /** Id estável da instância do worker no host (ex. hostname+pid). */
  @Column({ name: 'host_instance_id', type: 'varchar', length: 120, nullable: true })
  hostInstanceId!: string | null;

  @Column({ name: 'worker_version', type: 'varchar', length: 40, nullable: true })
  workerVersion!: string | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
