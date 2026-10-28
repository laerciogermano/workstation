import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';

/**
 * Ligação usuário (role=gestor) ↔ agente.
 * Cada `agentId` pertence a no máximo 1 gestor.
 */
@Entity('gestor_agentes')
export class GestorAgente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** FK → users.id (usuário com role gestor). */
  @Index()
  @Column({ name: 'gestor_id', type: 'uuid' })
  gestorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gestor_id' })
  gestor!: User;

  /** Identificador do agente = `agentes.id` (uuid). */
  @Index({ unique: true })
  @Column({ name: 'agent_id', type: 'varchar', length: 120 })
  agentId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
