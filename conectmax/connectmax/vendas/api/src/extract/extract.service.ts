import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ProfilesService } from '../profiles/profiles.service';

export type ExtractKind = 'list' | 'detail' | null;

export type ExtractStatus = {
  running: boolean;
  kind: ExtractKind;
  profileId: string | null;
  profileUrl: string | null;
  startedAt: string | null;
  pid: number | null;
  exitCode: number | null;
  lastError: string | null;
  /**
   * Cards People skipados por já existirem na base (acumulado no run).
   * Alto → busca genérica demais; vale refinar a query.
   */
  fails: number;
  /** Skips “já existe” na última viewport reportada. */
  lastViewportFails: number;
};

@Injectable()
export class ExtractService implements OnModuleDestroy {
  private readonly logger = new Logger(ExtractService.name);
  private child: ChildProcess | null = null;
  private kind: ExtractKind = null;
  private profileId: string | null = null;
  private profileUrl: string | null = null;
  private startedAt: string | null = null;
  private exitCode: number | null = null;
  private lastError: string | null = null;
  private fails = 0;
  private lastViewportFails = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly profiles: ProfilesService,
  ) {}

  status(): ExtractStatus {
    return {
      running: this.child != null && this.child.exitCode == null,
      kind: this.kind,
      profileId: this.profileId,
      profileUrl: this.profileUrl,
      startedAt: this.startedAt,
      pid: this.child?.pid ?? null,
      exitCode: this.exitCode,
      lastError: this.lastError,
      fails: this.fails,
      lastViewportFails: this.lastViewportFails,
    };
  }

  /**
   * Robô reporta skips por “já existe”.
   * - `viewportFails`: na tela atual (incrementa `fails`)
   * - `fails`: total absoluto do run (opcional; sobrescreve acumulado)
   */
  reportFails(opts: {
    viewportFails?: number;
    fails?: number;
  }): ExtractStatus {
    const vf = Number(opts?.viewportFails);
    if (Number.isFinite(vf) && vf >= 0) {
      this.lastViewportFails = Math.floor(vf);
      this.fails += this.lastViewportFails;
    }
    const abs = Number(opts?.fails);
    if (Number.isFinite(abs) && abs >= 0) {
      this.fails = Math.floor(abs);
    }
    this.logger.log(
      `extract fails=${this.fails} lastViewportFails=${this.lastViewportFails}`,
    );
    return this.status();
  }

  /** Lista: login-extract-profiles [--max-profiles N] [--query termo] */
  start(opts?: { limit?: string | number; query?: string }): ExtractStatus {
    const raw = Number(opts?.limit);
    const maxProfiles =
      Number.isFinite(raw) && raw >= 1
        ? Math.min(500, Math.floor(raw))
        : 10;
    const query = String(opts?.query ?? '')
      .trim()
      .slice(0, 200);
    const args = ['--', '--max-profiles', String(maxProfiles)];
    if (query) args.push('--query', query);
    return this.spawnScript({
      kind: 'list',
      npmScript: 'login-extract-profiles',
      args,
      profileId: null,
      profileUrl: null,
    });
  }

  /** Detalhe: login-extract-profile-detail --id <uuid> */
  startDetail(profileId: string): ExtractStatus {
    const id = String(profileId || '').trim();
    if (!id) {
      throw new BadRequestException('query id (uuid do perfil) é obrigatório');
    }
    return this.spawnScript({
      kind: 'detail',
      npmScript: 'login-extract-profile-detail',
      args: ['--', '--id', id],
      profileId: id,
      profileUrl: null,
    });
  }

  /**
   * Deep link por URL → OCR cartão (avatar/nome/infos) → POST /profile-details.
   * Cria stub em `cliente_linkedin` (+ `clientes`) se a URL ainda não existir.
   */
  async startByUrl(rawUrl: string): Promise<ExtractStatus & { created: boolean }> {
    const ensured = await this.profiles.ensureForLinkedInUrl(rawUrl);
    const status = this.spawnScript({
      kind: 'detail',
      npmScript: 'login-extract-profile-detail',
      args: [
        '--',
        '--id',
        ensured.id,
        '--from-profile',
        '--url',
        ensured.profileUrl,
      ],
      profileId: ensured.id,
      profileUrl: ensured.profileUrl,
    });
    return { ...status, created: ensured.created };
  }

  private spawnScript(opts: {
    kind: Exclude<ExtractKind, null>;
    npmScript: string;
    args: string[];
    profileId: string | null;
    profileUrl: string | null;
  }): ExtractStatus {
    if (this.child != null && this.child.exitCode == null) {
      throw new ConflictException('extract já em execução');
    }

    const cwd = resolve(
      process.cwd(),
      this.config.get<string>(
        'EXTRACT_CWD',
        '../../../../screen-robot/src',
      ),
    );
    if (!existsSync(cwd)) {
      throw new NotFoundException(`EXTRACT_CWD inexistente: ${cwd}`);
    }

    const port = this.config.get<string>('PORT', '3000');
    const apiUrl =
      this.config.get<string>('PROFILES_API_URL') ||
      `http://127.0.0.1:${port}`;

    this.exitCode = null;
    this.lastError = null;
    this.fails = 0;
    this.lastViewportFails = 0;
    this.kind = opts.kind;
    this.profileId = opts.profileId;
    this.profileUrl = opts.profileUrl;
    this.startedAt = new Date().toISOString();

    const child = spawn(
      'npm',
      ['run', opts.npmScript, ...opts.args],
      {
        cwd,
        env: {
          ...process.env,
          PROFILES_API_URL: apiUrl,
          ...(this.config.get<string>('AGENT_API_KEY')?.trim()
            ? {
                AGENT_API_KEY: this.config
                  .get<string>('AGENT_API_KEY')!
                  .trim(),
              }
            : {}),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      },
    );

    this.child = child;
    this.logger.log(
      `extract kind=${opts.kind} pid=${child.pid} profileId=${opts.profileId ?? '-'} url=${opts.profileUrl ?? '-'} cwd=${cwd}`,
    );

    child.stdout?.on('data', (buf: Buffer) => {
      process.stdout.write(`[extract] ${buf.toString()}`);
    });
    child.stderr?.on('data', (buf: Buffer) => {
      process.stderr.write(`[extract:err] ${buf.toString()}`);
    });
    child.on('error', (err) => {
      this.lastError = err.message;
      this.logger.error(`extract spawn falhou: ${err.message}`);
      this.child = null;
    });
    child.on('exit', (code, signal) => {
      this.exitCode = code;
      if (signal) this.lastError = `sinal ${signal}`;
      this.logger.log(`extract saiu code=${code} signal=${signal}`);
      this.child = null;
    });

    return this.status();
  }

  onModuleDestroy() {
    if (this.child && this.child.exitCode == null) {
      this.child.kill('SIGTERM');
      this.child = null;
    }
  }
}
