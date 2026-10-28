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
import { ClientLinkedinMessageDirection } from './client-linkedin-message-direction';

/**
 * Mensagens LinkedIn enviadas/recebidas com um `cliente_linkedin`.
 * Upsert por (cliente_linkedin_id, agent_id, fingerprint).
 */
@Entity('client_linkedin_message')
@Index(['clienteLinkedinId', 'agentId', 'fingerprint'], { unique: true })
export class ClientLinkedinMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'cliente_linkedin_id', type: 'uuid' })
  clienteLinkedinId!: string;

  @ManyToOne(() => ClienteLinkedin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_linkedin_id' })
  clienteLinkedin!: ClienteLinkedin;

  /** Agente que enviou/leu (ex.: `provision.name` / `AGENT_ID`). */
  @Index()
  @Column({ name: 'agent_id', type: 'varchar', length: 120 })
  agentId!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: ClientLinkedinMessageDirection.SENT,
  })
  direction!: ClientLinkedinMessageDirection;

  /** Nome exibido no chat (Matheus / Laércio…). */
  @Column({ type: 'varchar', length: 300, nullable: true })
  sender!: string | null;

  @Column({ type: 'text' })
  message!: string;

  /** Rótulo de tempo da UI LinkedIn (ex.: `8:47 AM`, `Yesterday`). */
  @Column({ name: 'time_label', type: 'varchar', length: 64, nullable: true })
  timeLabel!: string | null;

  /** Instantâneo quando conhecido (envio nosso = now). */
  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  /**
   * Chave estável p/ dedupe: direction|time_label|message (normalizado).
   */
  @Column({ type: 'varchar', length: 64 })
  fingerprint!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
