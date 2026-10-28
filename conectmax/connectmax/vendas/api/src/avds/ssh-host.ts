import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import type { Servidor } from '../servidores/servidor.entity';

export type SshTarget = {
  host: string;
  port: number;
  user: string;
  password: string | null;
  /** true → executa no host da API (sem SSH). */
  local?: boolean;
};

export function sshTargetFromServidor(s: Servidor): SshTarget {
  if (s.localhost) {
    return {
      host: '127.0.0.1',
      port: s.sshPort || 22,
      user: s.sshUser || 'root',
      password: null,
      local: true,
    };
  }
  const host = (s.ipPrivado || s.ipPublico || '').trim();
  if (!host) {
    throw new Error(`servidor ${s.id} sem ipPrivado/ipPublico`);
  }
  const local =
    host === '127.0.0.1' ||
    host === 'localhost' ||
    host === '::1';
  return {
    host,
    port: s.sshPort || 22,
    user: s.sshUser || 'root',
    password: local ? null : (s.sshPassword ?? null),
    local,
  };
}

function sshBaseArgs(t: SshTarget): string[] {
  return [
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    'ConnectTimeout=20',
    '-o',
    'BatchMode=no',
    '-p',
    String(t.port),
    `${t.user}@${t.host}`,
  ];
}

/**
 * Executa comando remoto via ssh (sshpass se houver senha).
 * Se `local`, roda `bash` no host da API.
 * Se `script` for passado, roda `bash -s` com o script no stdin (mais seguro p/ multilinha).
 */
export function sshExec(
  t: SshTarget,
  remoteCommand: string,
  opts?: { timeoutMs?: number; script?: string },
): Promise<{ stdout: string; stderr: string; code: number }> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;

  if (t.local) {
    const args = opts?.script != null ? ['-s'] : ['-c', remoteCommand];
    return new Promise((resolve, reject) => {
      const child = spawn('bash', args, {
        stdio: [opts?.script != null ? 'pipe' : 'ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`local timeout ${timeoutMs}ms`));
      }, timeoutMs);

      if (opts?.script != null && child.stdin) {
        child.stdin.write(opts.script);
        child.stdin.end();
      }

      child.stdout?.on('data', (buf: Buffer) => {
        stdout += buf.toString('utf8');
      });
      child.stderr?.on('data', (buf: Buffer) => {
        stderr += buf.toString('utf8');
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        const c = code ?? 1;
        if (c !== 0) {
          reject(
            new Error(
              `local exit ${c}: ${(stderr || stdout).trim().slice(0, 800)}`,
            ),
          );
          return;
        }
        resolve({ stdout, stderr, code: c });
      });
    });
  }

  const usePass = Boolean(t.password);
  const bin = usePass ? 'sshpass' : 'ssh';
  const remote = opts?.script != null ? 'bash -s' : remoteCommand;
  const args = usePass
    ? ['-p', t.password!, 'ssh', ...sshBaseArgs(t), remote]
    : [...sshBaseArgs(t), remote];

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: [opts?.script != null ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`ssh timeout ${timeoutMs}ms → ${t.user}@${t.host}`));
    }, timeoutMs);

    if (opts?.script != null && child.stdin) {
      child.stdin.write(opts.script);
      child.stdin.end();
    }

    child.stdout?.on('data', (buf: Buffer) => {
      stdout += buf.toString('utf8');
    });
    child.stderr?.on('data', (buf: Buffer) => {
      stderr += buf.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const c = code ?? 1;
      if (c !== 0) {
        reject(
          new Error(
            `ssh exit ${c} @ ${t.host}: ${(stderr || stdout).trim().slice(0, 800)}`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr, code: c });
    });
  });
}

/** Stream stdout de `cat` remoto (download de backup). Local → fs.createReadStream. */
export function sshCatStream(
  t: SshTarget,
  remotePath: string,
): Readable {
  if (t.local) {
    return createReadStream(remotePath);
  }
  const escaped = remotePath.replace(/'/g, `'\\''`);
  const usePass = Boolean(t.password);
  const bin = usePass ? 'sshpass' : 'ssh';
  const args = usePass
    ? [
        '-p',
        t.password!,
        'ssh',
        ...sshBaseArgs(t),
        `cat -- '${escaped}'`,
      ]
    : [...sshBaseArgs(t), `cat -- '${escaped}'`];

  const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const out = child.stdout;
  if (!out) {
    throw new Error('ssh cat: sem stdout');
  }
  child.stderr?.on('data', () => {
    /* drain */
  });
  child.on('error', (err) => {
    out.destroy(err);
  });
  child.on('close', (code) => {
    if (code && code !== 0) {
      out.destroy(new Error(`ssh cat exit ${code}`));
    }
  });
  return out;
}

/** Escapa string para uso em aspas simples no bash remoto. */
export function shQuote(s: string): string {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}
