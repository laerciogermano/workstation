import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Empresa (cliente B2B) — CNPJ + razão social vindos do portal/planilhas funil.
 */
@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** CNPJ formatado (00.000.000/0000-00). Null se só vimos o nome nas planilhas. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 18, nullable: true })
  cnpj!: string | null;

  /** Só dígitos (14) — upsert/busca. Postgres permite vários NULL. */
  @Index({ unique: true })
  @Column({ name: 'cnpj_digits', type: 'varchar', length: 14, nullable: true })
  cnpjDigits!: string | null;

  @Column({ name: 'razao_social', type: 'varchar', length: 400 })
  razaoSocial!: string;

  @Column({ name: 'nome_fantasia', type: 'varchar', length: 400, nullable: true })
  nomeFantasia!: string | null;

  /** Origens: portal_contas_receber, planilha_pedidos, planilha_orcamentos… */
  @Column({ type: 'text', array: true, default: '{}' })
  fontes!: string[];

  @Column({ name: 'pedidos_qtd', type: 'int', default: 0 })
  pedidosQtd!: number;

  @Column({
    name: 'pedidos_valor',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  pedidosValor!: string;

  @Column({ name: 'orcamentos_qtd', type: 'int', default: 0 })
  orcamentosQtd!: number;

  @Column({
    name: 'orcamentos_valor',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  orcamentosValor!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  vendedores!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
