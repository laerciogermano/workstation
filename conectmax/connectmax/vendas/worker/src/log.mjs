/**
 * Logs legíveis no terminal (data+hora local + tag curta + mensagem em PT).
 * Env: WORKER_LOG_VERBOSE=0 silencia linhas "debug" (heartbeat ok).
 * Fuso: WORKER_LOG_TZ (default America/Sao_Paulo) — não usa UTC do ISO.
 */

const LOG_TZ =
  String(process.env.WORKER_LOG_TZ || 'America/Sao_Paulo').trim() ||
  'America/Sao_Paulo';

/** Data+hora local legível (ex.: 04/11/2026 09:14:10). */
export function ts(date = new Date()) {
  const d = date instanceof Date ? date : new Date();
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: LOG_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

function shortTag(tag) {
  const s = String(tag || 'worker');
  if (s.length <= 12) return s;
  // uuid → 8 chars; senão corta
  return /^[0-9a-f-]{36}$/i.test(s) ? s.slice(0, 8) : s.slice(0, 12);
}

export function isVerboseLog() {
  const v = String(process.env.WORKER_LOG_VERBOSE ?? '1').trim();
  return !/^(0|false|no|off)$/i.test(v);
}

/** Formata duração em linguagem humana. */
export function fmtDuration(ms) {
  const n = Math.max(0, Math.round(Number(ms) || 0));
  if (n < 1000) return `${n}ms`;
  const s = Math.round(n / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return rs ? `${m}min ${rs}s` : `${m}min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}

export function createLogger(tag) {
  const t = shortTag(tag);
  const prefix = () => `${ts()} [${t}]`;

  return {
    tag: t,
    info(msg, ...rest) {
      console.log(`${prefix()} ${msg}`, ...rest);
    },
    warn(msg, ...rest) {
      console.warn(`${prefix()} ⚠ ${msg}`, ...rest);
    },
    error(msg, ...rest) {
      console.error(`${prefix()} ✖ ${msg}`, ...rest);
    },
    /** Só imprime se WORKER_LOG_VERBOSE ≠ 0 (default ligado). */
    debug(msg, ...rest) {
      if (!isVerboseLog()) return;
      console.log(`${prefix()} · ${msg}`, ...rest);
    },
    /** Troca o tag (ex.: após enroll com uuid canônico). */
    withTag(next) {
      return createLogger(next);
    },
  };
}

/** Nomes amigáveis dos tipos de job. */
export function jobTypeLabel(type) {
  const map = {
    extrair_leads: 'buscar candidatos',
    conectar: 'enviar conexão',
    verificar_conexoes: 'verificar conexões',
    enviar_prospeccao: 'enviar mensagem',
    ler_mensagens: 'ler mensagens',
  };
  const t = String(type || '');
  return map[t] || t || '(tipo?)';
}
