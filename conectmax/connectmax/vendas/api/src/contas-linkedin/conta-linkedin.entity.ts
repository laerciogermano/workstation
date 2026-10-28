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
import { Agente } from '../agentes/agente.entity';

/** Status operacional da conta no LinkedIn. */
export type ContaLinkedinStatus =
  | 'ativa'
  | 'restrita'
  | 'banida'
  | 'inativa';

/** Infração / restrição registrada pelo LinkedIn. */
export type ContaLinkedinInfracao = {
  /** Ex.: warning, restriction, temporary_ban, permanent_ban */
  tipo: string;
  descricao: string;
  /** ISO date (YYYY-MM-DD) ou datetime */
  data?: string | null;
  resolvida?: boolean;
};

/**
 * Conta LinkedIn vinculada a um agente (1 agente → 1 conta).
 */
@Entity('contas_linkedin')
export class ContaLinkedin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Agente que opera esta conta (único). */
  @Index({ unique: true })
  @Column({ name: 'agente_id', type: 'uuid' })
  agenteId!: string;

  @ManyToOne(() => Agente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agente_id' })
  agente!: Agente;

  /** Nome de exibição / perfil. */
  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  /** Login LinkedIn (e-mail ou telefone). */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  usuario!: string;

  /** Senha LinkedIn (ops interno). */
  @Column({ type: 'varchar', length: 400 })
  senha!: string;

  /** URL do perfil (https://www.linkedin.com/in/…). */
  @Column({ name: 'profile_url', type: 'varchar', length: 500, nullable: true })
  profileUrl!: string | null;

  /** Headline / cargo no LinkedIn. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  headline!: string | null;

  /** Foto de perfil (data URL ou base64 puro). */
  @Column({ name: 'photo_base64', type: 'text', nullable: true })
  photoBase64!: string | null;

  /** ativa | restrita | banida | inativa */
  @Column({ type: 'varchar', length: 32, default: 'ativa' })
  status!: ContaLinkedinStatus;

  /** Infrações / restrições cadastradas. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  infracoes!: ContaLinkedinInfracao[];

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
