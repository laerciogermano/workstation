import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Status operacional do container no host. */
export type AgenteStatus = 'ativo' | 'dormindo' | 'criando' | 'erro';

/** Status da conta LinkedIn embutida no agente. */
export type AgenteLinkedinStatus =
  | 'ativa'
  | 'restrita'
  | 'banida'
  | 'inativa';

export type AgenteLinkedinInfracao = {
  tipo: string;
  descricao: string;
  data?: string | null;
  resolvida?: boolean;
};

/**
 * Agente = vendedor operacional: host (IP/SSH) + device (ADB) + LinkedIn numa linha.
 * `id` = agentId (fila/worker/funil). `nome` = rótulo editável.
 */
@Entity('agentes')
export class Agente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Rótulo único (não é a chave da fila). */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  /** Nome de apresentação na prospecção (`{{firstname}}`). */
  @Column({ name: 'first_name', type: 'varchar', length: 120, nullable: true })
  firstName!: string | null;

  /** Sobrenome de apresentação (`{{lastname}}`). */
  @Column({ name: 'last_name', type: 'varchar', length: 120, nullable: true })
  lastName!: string | null;

  // —— Host ——

  @Column({ name: 'host_nome', type: 'varchar', length: 200 })
  hostNome!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  provedor!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  produto!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  hostname!: string | null;

  /** Opcional: gestor/NAT não precisa de IP público (worker pull). */
  @Column({ name: 'ip_publico', type: 'varchar', length: 64, nullable: true })
  ipPublico!: string | null;

  @Column({ name: 'ip_privado', type: 'varchar', length: 64, nullable: true })
  ipPrivado!: string | null;

  @Column({ type: 'boolean', default: false })
  localhost!: boolean;

  /** server | gestor | localhost — onde o AVD/worker roda. */
  @Column({ name: 'host_kind', type: 'varchar', length: 32, default: 'server' })
  hostKind!: string;

  /**
   * SHA-256 hex da API key do worker (plain só na emissão).
   * `select: false` — não vaza em listagens.
   */
  @Column({
    name: 'api_key_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
    select: false,
  })
  apiKeyHash!: string | null;

  @Column({ name: 'ssh_user', type: 'varchar', length: 64, default: 'root' })
  sshUser!: string;

  @Column({ name: 'ssh_port', type: 'int', default: 22 })
  sshPort!: number;

  @Column({ name: 'ssh_password', type: 'varchar', length: 400, nullable: true })
  sshPassword!: string | null;

  @Column({ name: 'ram_gb', type: 'int', nullable: true })
  ramGb!: number | null;

  /** Disco livre/total aproximado da máquina (GB), informado no cadastro. */
  @Column({ name: 'disk_gb', type: 'int', nullable: true })
  diskGb!: number | null;

  @Column({ name: 'nested_kvm', type: 'boolean', default: false })
  nestedKvm!: boolean;

  /** active | inactive | maintenance */
  @Column({ name: 'host_status', type: 'varchar', length: 32, default: 'active' })
  hostStatus!: string;

  // —— Device (ex-AVD) ——

  @Column({ name: 'container_name', type: 'varchar', length: 160 })
  containerName!: string;

  @Column({ type: 'varchar', length: 400 })
  image!: string;

  @Column({ name: 'adb_port', type: 'int' })
  adbPort!: number;

  @Column({ type: 'varchar', length: 64 })
  serial!: string;

  /** ativo | dormindo | criando | erro */
  @Column({ type: 'varchar', length: 32, default: 'dormindo' })
  status!: AgenteStatus;

  @Column({ name: 'last_backup_path', type: 'varchar', length: 500, nullable: true })
  lastBackupPath!: string | null;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  // —— Conta LinkedIn (ex-contas_linkedin) ——

  @Column({ name: 'linkedin_nome', type: 'varchar', length: 200, nullable: true })
  linkedinNome!: string | null;

  /** Login LinkedIn (e-mail ou telefone). */
  @Index({ unique: true })
  @Column({ name: 'linkedin_usuario', type: 'varchar', length: 320, nullable: true })
  linkedinUsuario!: string | null;

  @Column({ name: 'linkedin_senha', type: 'varchar', length: 400, nullable: true })
  linkedinSenha!: string | null;

  @Column({ name: 'linkedin_profile_url', type: 'varchar', length: 500, nullable: true })
  linkedinProfileUrl!: string | null;

  @Column({ name: 'linkedin_headline', type: 'varchar', length: 500, nullable: true })
  linkedinHeadline!: string | null;

  @Column({ name: 'linkedin_photo_base64', type: 'text', nullable: true })
  linkedinPhotoBase64!: string | null;

  /** ativa | restrita | banida | inativa */
  @Column({
    name: 'linkedin_status',
    type: 'varchar',
    length: 32,
    default: 'ativa',
  })
  linkedinStatus!: AgenteLinkedinStatus;

  @Column({
    name: 'linkedin_infracoes',
    type: 'jsonb',
    default: () => "'[]'",
  })
  linkedinInfracoes!: AgenteLinkedinInfracao[];

  /**
   * Procedimentos (tipos de job) que este agente pode executar.
   * `null` = herda flags/env globais (`AGENT_MATERIALIZE_TYPES` / flags).
   * Array (mesmo vazio) = allowlist do agente (ainda intersecta `AGENT_MATERIALIZE_TYPES` se setado).
   */
  @Column({
    name: 'procedimentos',
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  procedimentos!: string[] | null;

  /**
   * Template da mensagem de prospecção (`enviar_prospeccao`).
   * Placeholders: cliente `{{primeiro_nome}}`/`{{sobrenome}}`; agente `{{firstname}}`/`{{lastname}}` (também `$…$`).
   */
  @Column({ name: 'mensagem_prospeccao', type: 'text', nullable: true })
  mensagemProspeccao!: string | null;

  /**
   * Início da janela de envio de prospecção (HH:MM, TZ do processo).
   * `null` → default `08:00`. Inclusivo.
   */
  @Column({
    name: 'prospeccao_hora_inicio',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  prospeccaoHoraInicio!: string | null;

  /**
   * Fim da janela de envio de prospecção (HH:MM). `null` → default `18:00`.
   * Exclusivo (ex.: 18:00 = até 17:59).
   */
  @Column({
    name: 'prospeccao_hora_fim',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  prospeccaoHoraFim!: string | null;

  /**
   * Texto de busca LinkedIn para `extrair_leads` (payload `query` do job).
   * Vazio → worker usa `EXTRACT_QUERY` / default do robô.
   */
  @Column({ name: 'search_query', type: 'varchar', length: 500, nullable: true })
  searchQuery!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
