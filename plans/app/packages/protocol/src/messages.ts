// Contrato entre front, hub e client. O client em Go segue o mesmo formato
// (apps/client/internal/protocol) e os mesmos vetores de teste (vectors/).
import { z } from 'zod';

export const PROTOCOL_VERSION = 1;
export const MAX_MESSAGE_BYTES = 256 * 1024;
export const OUTPUT_CHUNK_BYTES = 16 * 1024;

export const roleSchema = z.enum(['front', 'client']);
export type Role = z.infer<typeof roleSchema>;
export const roomSchema = z.string().regex(/^[0-9a-f]{32}$/);

// ---------- com o hub (visível a ele) ----------
export const joinSchema = z.object({
  type: z.literal('join'),
  protocol: z.literal(PROTOCOL_VERSION),
  room: roomSchema,
  role: roleSchema,
});
export const relaySchema = z.object({
  type: z.literal('relay'),
  iv: z.string().regex(/^[A-Za-z0-9_-]{16}$/),
  body: z.string().regex(/^[A-Za-z0-9_-]+$/),
});
export const peerSchema = z.object({ type: z.literal('peer'), role: roleSchema, online: z.boolean() });
export const hubErrorSchema = z.object({ type: z.literal('error'), code: z.string() });
export const fromHubSchema = z.discriminatedUnion('type', [relaySchema, peerSchema, hubErrorSchema, z.object({ type: z.literal('joined') })]);

export type Relay = z.infer<typeof relaySchema>;
export type FromHub = z.infer<typeof fromHubSchema>;

// ---------- cifrado (só front e client leem) ----------
const runId = z.uuid();
export const commandSchema = z.object({
  program: z.string().max(1024).optional(),
  args: z.array(z.string().max(8192)).max(256).optional(),
  script: z.string().max(32_768).optional(),
  shell: z.string().max(32).optional(),
  cwd: z.string().max(1024).optional(),
});
export type Command = z.infer<typeof commandSchema>;

export const runStatusSchema = z.enum(['pending', 'running', 'done']);
export const endReasonSchema = z.enum(['exit', 'cancelled', 'timeout', 'error']);

export const messageSchema = z.discriminatedUnion('type', [
  // front → client
  z.object({ type: z.literal('front.hello'), nonce: z.string().min(8).max(64) }),
  commandSchema.extend({
    type: z.literal('exec.start'),
    runId,
    nodeId: z.string().max(64).optional(),
    timeoutSec: z.number().int().min(1).max(86_400).optional(),
  }),
  z.object({ type: z.literal('exec.cancel'), runId }),
  z.object({ type: z.literal('exec.list') }),
  z.object({ type: z.literal('exec.resume'), runId, fromChunk: z.number().int().min(0) }),
  z.object({ type: z.literal('exec.ack'), runId }),
  // client → front
  z.object({
    type: z.literal('hello'),
    nonce: z.string(),
    projectId: z.string(),
    os: z.string(),
    arch: z.string(),
    shells: z.array(z.string()),
    version: z.string(),
  }),
  z.object({ type: z.literal('exec.pending'), runId }),
  z.object({ type: z.literal('exec.started'), runId }),
  z.object({
    type: z.literal('exec.output'),
    runId,
    n: z.number().int().min(0),
    stream: z.enum(['stdout', 'stderr']),
    data: z.string(),
  }),
  z.object({
    type: z.literal('exec.exit'),
    runId,
    reason: endReasonSchema,
    code: z.number().int(),
    chunks: z.number().int().min(0),
    durationMs: z.number().int().min(0),
    truncated: z.boolean(),
    error: z.string().optional(),
  }),
  z.object({ type: z.literal('exec.rejected'), runId, reason: z.string(), allowCommand: z.string().optional() }),
  z.object({
    type: z.literal('exec.runs'),
    runs: z.array(
      commandSchema.extend({ runId, nodeId: z.string().optional(), status: runStatusSchema, startedAt: z.string() }),
    ),
  }),
]);
export type Message = z.infer<typeof messageSchema>;
export type MessageOf<T extends Message['type']> = Extract<Message, { type: T }>;

export const innerSchema = z.object({
  sender: z.string().min(8).max(64),
  /** vazio só em front.hello, antes de o front conhecer a sessão do client */
  session: z.string().max(64),
  seq: z.number().int().min(1),
  msg: messageSchema,
});
export type Inner = z.infer<typeof innerSchema>;
