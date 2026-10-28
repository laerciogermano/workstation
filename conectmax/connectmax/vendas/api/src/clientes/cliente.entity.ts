import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClienteLinkedin } from './cliente-linkedin.entity';

/**
 * Identidade canônica do cliente (canal-agnóstica).
 * Dados de canal (LinkedIn, WhatsApp, e-mail…) ficam em tabelas filhas.
 */
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  telefone!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  empresa!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  cargo!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cidade!: string | null;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @OneToOne(() => ClienteLinkedin, (li) => li.cliente)
  linkedin?: ClienteLinkedin | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
