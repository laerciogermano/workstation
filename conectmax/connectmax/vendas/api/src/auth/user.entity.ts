import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  email!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 120 })
  passwordHash!: string;

  /**
   * Roles acumuláveis (ex.: admin + gestor + dev).
   * Fonte de verdade. Coluna legada `role` permanece p/ APIs antigas / sync.
   */
  @Column({ type: 'jsonb', default: () => `'["viewer"]'` })
  roles!: UserRole[];

  /**
   * Legado (singular). Mantida para não quebrar deploy antigo e como espelho
   * da role primária. Preferir `roles`.
   */
  @Column({ type: 'varchar', length: 32, default: UserRole.Viewer })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
