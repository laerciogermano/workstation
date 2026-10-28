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
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { ClientConnectionLinkedinStatus } from './client-connection-linkedin-status';

/**
 * Ligação entre um agente nosso e um `cliente_linkedin`.
 * Um par (agente, cliente_linkedin) = uma linha.
 * No máx. um dono ativo (status 0|1|2) por perfil — evita dois agentes no mesmo lead.
 */
@Entity('client_connection_linkedin')
@Index(['clienteLinkedinId', 'agentId'], { unique: true })
@Index('UQ_ccl_one_active_owner', ['clienteLinkedinId'], {
  unique: true,
  where: 'status IN (0, 1, 2)',
})
export class ClientConnectionLinkedin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'cliente_linkedin_id', type: 'uuid' })
  clienteLinkedinId!: string;

  @ManyToOne(() => ClienteLinkedin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_linkedin_id' })
  clienteLinkedin!: ClienteLinkedin;

  /** Identificador do agente (ex.: `provision.name` / `AGENT_ID`). */
  @Index()
  @Column({ name: 'agent_id', type: 'varchar', length: 120 })
  agentId!: string;

  /**
   * 0 = nao_enviado · 1 = pendente · 2 = conectado · 3 = descartado
   * @see ClientConnectionLinkedinStatus
   */
  @Column({
    type: 'smallint',
    default: ClientConnectionLinkedinStatus.NOT_SENT,
  })
  status!: ClientConnectionLinkedinStatus;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt!: Date | null;

  @Column({ name: 'connected_at', type: 'timestamptz', nullable: true })
  connectedAt!: Date | null;

  /** Motivo do descarte (ex.: página LinkedIn inexistente). */
  @Column({ name: 'discard_reason', type: 'varchar', length: 500, nullable: true })
  discardReason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  steps!: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
