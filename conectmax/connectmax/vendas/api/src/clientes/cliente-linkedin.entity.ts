import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';

/**
 * Dados LinkedIn do cliente (1:1 com `clientes`).
 * Fonte única do extract (antes: linkedin_profiles + profile_details).
 */
@Entity('cliente_linkedin')
export class ClienteLinkedin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId!: string;

  @OneToOne(() => Cliente, (c) => c.linkedin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  /** URL canônica `linkedin.com/in/…` quando conhecida. */
  @Index({ unique: true, where: "profile_url IS NOT NULL AND profile_url <> ''" })
  @Column({ name: 'profile_url', type: 'varchar', length: 500, nullable: true })
  profileUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  company!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  connections!: string | null;

  @Column({ name: 'mutual_connections', type: 'varchar', length: 500, nullable: true })
  mutualConnections!: string | null;

  @Column({ name: 'connection_degree', type: 'varchar', length: 16, nullable: true })
  connectionDegree!: string | null;

  /** connect | pending | connected */
  @Column({ name: 'invite_status', type: 'varchar', length: 16, nullable: true })
  inviteStatus!: string | null;

  @Column({ name: 'can_connect', type: 'boolean', nullable: true })
  canConnect!: boolean | null;

  @Column({ name: 'can_message', type: 'boolean', nullable: true })
  canMessage!: boolean | null;

  @Column({ type: 'text', nullable: true })
  about!: string | null;

  @Column({ type: 'text', nullable: true })
  experience!: string | null;

  @Column({ type: 'text', nullable: true })
  education!: string | null;

  @Column({ type: 'text', nullable: true })
  skills!: string | null;

  /** Termo curto p/ busca no detail. */
  @Column({ name: 'search_query', type: 'varchar', length: 120, nullable: true })
  searchQuery!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  past!: string | null;

  @Column({ type: 'int', nullable: true })
  round!: number | null;

  @Column({ name: 'photo_base64', type: 'text', nullable: true })
  photoBase64!: string | null;

  @Column({ name: 'cover_base64', type: 'text', nullable: true })
  coverBase64!: string | null;

  @Column({ name: 'card_base64', type: 'text', nullable: true })
  cardBase64!: string | null;

  @Column({ name: 'raw_ocr', type: 'jsonb', nullable: true })
  rawOcr!: Record<string, unknown> | null;

  @Column({ name: 'extracted_at', type: 'timestamptz', nullable: true })
  extractedAt!: Date | null;

  /** Soft-delete (Candidatos): null = ativo. */
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
