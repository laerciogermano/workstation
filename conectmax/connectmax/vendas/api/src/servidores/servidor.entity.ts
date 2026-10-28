import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Servidor de infra (VPS/VDS) — hosts onde rodam AVDs / agentes.
 */
@Entity('servidores')
export class Servidor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  /** Ex.: Contabo, AWS, Hetzner */
  @Column({ type: 'varchar', length: 120, nullable: true })
  provedor!: string | null;

  /** Ex.: Cloud VDS / Max Performance */
  @Column({ type: 'varchar', length: 200, nullable: true })
  produto!: string | null;

  /** Hostname do painel (ex.: vmi3645369) */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  hostname!: string | null;

  @Index({ unique: true })
  @Column({ name: 'ip_publico', type: 'varchar', length: 64 })
  ipPublico!: string;

  /** IP Tailscale / rede privada (opcional) */
  @Column({ name: 'ip_privado', type: 'varchar', length: 64, nullable: true })
  ipPrivado!: string | null;

  /**
   * Host da própria API (sem SSH remoto).
   * Comandos Docker/AVD rodam localmente em 127.0.0.1.
   */
  @Column({ type: 'boolean', default: false })
  localhost!: boolean;

  @Column({ name: 'ssh_user', type: 'varchar', length: 64, default: 'root' })
  sshUser!: string;

  @Column({ name: 'ssh_port', type: 'int', default: 22 })
  sshPort!: number;

  /** Senha SSH (ops interno). Preferir chave quando possível. */
  @Column({ name: 'ssh_password', type: 'varchar', length: 400, nullable: true })
  sshPassword!: string | null;

  @Column({ name: 'ram_gb', type: 'int', nullable: true })
  ramGb!: number | null;

  /** Nested KVM disponível (necessário p/ docker-avd) */
  @Column({ name: 'nested_kvm', type: 'boolean', default: false })
  nestedKvm!: boolean;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  /** active | inactive | maintenance */
  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
