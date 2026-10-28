import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClientConnectionLinkedinStatus } from '../client-connections-linkedin/client-connection-linkedin-status';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { Cliente } from '../clientes/cliente.entity';
import { ClientLinkedinMessageDirection } from './client-linkedin-message-direction';
import { ClientLinkedinMessage } from './client-linkedin-message.entity';
import {
  ClientLinkedinMessageItemDto,
  UpsertClientLinkedinMessagesDto,
} from './create-client-linkedin-message.dto';

function normalizeProfileUrl(raw: string): string {
  const s = String(raw || '').trim();
  const m = s.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9._%-]+)/i,
  );
  if (!m) return s.replace(/\/$/, '');
  return `https://www.linkedin.com/in/${decodeURIComponent(m[1])}`;
}

function slugFromProfileUrl(url: string): string {
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : 'LinkedIn contact';
}

/** Corpo estável p/ dedupe (acento/case/espaços). */
export function normalizeMessageBody(message: string): string {
  return String(message || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Identidade = direction + texto normalizado.
 * (sem direction, "oi" sent e "oi" received viravam 1 e sumiam no fio)
 */
export function messageFingerprint(
  direction: string,
  message: string,
  _timeLabel?: string | null,
): string {
  const dir = String(direction || '').trim().toLowerCase() || 'x';
  return createHash('sha256')
    .update(`${dir}|${normalizeMessageBody(message)}`, 'utf8')
    .digest('hex')
    .slice(0, 40);
}

function senderRank(sender: string | null | undefined): number {
  const s = String(sender || '').trim().toLowerCase();
  if (!s || s === 'unknown') return 0;
  return 2;
}

function directionRank(direction: string): number {
  return direction === ClientLinkedinMessageDirection.SENT ||
    direction === ClientLinkedinMessageDirection.RECEIVED
    ? 1
    : 0;
}

/**
 * Mesma bolha (mesmo sentido): texto igual OU um contém o outro
 * (OCR truncou/colou; min 40 chars). Direções diferentes nunca colapsam.
 */
export function sameMessageBubble(
  a: string,
  b: string,
  dirA?: string | null,
  dirB?: string | null,
): boolean {
  if (dirA && dirB && String(dirA) !== String(dirB)) return false;
  const na = normalizeMessageBody(a);
  const nb = normalizeMessageBody(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (short.length < 40) return false;
  return long.includes(short);
}

@Injectable()
export class ClientLinkedinMessagesService {
  constructor(
    @InjectRepository(ClientLinkedinMessage)
    private readonly messages: Repository<ClientLinkedinMessage>,
    @InjectRepository(ClienteLinkedin)
    private readonly clienteLinkedin: Repository<ClienteLinkedin>,
    @InjectRepository(Cliente)
    private readonly clientes: Repository<Cliente>,
    @InjectRepository(ClientConnectionLinkedin)
    private readonly connections: Repository<ClientConnectionLinkedin>,
  ) {}

  async upsertBatch(dto: UpsertClientLinkedinMessagesDto): Promise<{
    ok: true;
    count: number;
    data: ClientLinkedinMessage[];
  }> {
    const agentId = String(dto.agentId || '').trim();
    if (!agentId) throw new BadRequestException('agentId obrigatório');

    const items = this.normalizeItems(dto);
    if (!items.length) {
      throw new BadRequestException('passe message ou messages[]');
    }

    const clienteLinkedinId = await this.ensureClienteLinkedinId(dto);

    /** Envio único (não lote de leitura do chat): só se conexão aceita. */
    const isOutboundSend =
      !dto.messages?.length &&
      items.length === 1 &&
      items[0].direction === ClientLinkedinMessageDirection.SENT;
    if (isOutboundSend) {
      await this.assertConnectionAccepted(clienteLinkedinId, agentId);
    }

    const deduped = this.dedupeBatchItems(items);
    const saved: ClientLinkedinMessage[] = [];
    const isBatch = deduped.length > 1;
    /** Lote do robot vem antigo→novo: grava occurredAt sequencial p/ o front ordenar. */
    const batchBaseMs = Date.now() - deduped.length * 60_000;

    for (let i = 0; i < deduped.length; i++) {
      const item = deduped[i];
      const timeLabel = item.timeLabel ?? item.time ?? null;
      const fingerprint = messageFingerprint(
        item.direction,
        item.message,
        timeLabel,
      );
      const occurredAt =
        item.occurredAt != null
          ? new Date(item.occurredAt)
          : isBatch
            ? new Date(batchBaseMs + i * 60_000)
            : item.direction === ClientLinkedinMessageDirection.SENT
              ? new Date()
              : null;

      const existing = await this.findExistingMessage(
        clienteLinkedinId,
        agentId,
        fingerprint,
        item.message,
        item.direction,
      );

      if (existing) {
        if (senderRank(item.sender) >= senderRank(existing.sender)) {
          existing.sender = item.sender ?? existing.sender;
        }
        if (
          normalizeMessageBody(item.message).length >=
          normalizeMessageBody(existing.message).length
        ) {
          existing.message = item.message;
        }
        if (timeLabel && (!existing.timeLabel || senderRank(item.sender) > 0)) {
          existing.timeLabel = timeLabel;
        }
        existing.direction = item.direction;
        existing.fingerprint = fingerprint;
        if (occurredAt) {
          existing.occurredAt = occurredAt;
        }
        saved.push(await this.messages.save(existing));
        await this.deleteSiblingDuplicates(
          clienteLinkedinId,
          agentId,
          fingerprint,
          existing.id,
          item.message,
          item.direction,
        );
      } else {
        const created = await this.messages.save(
          this.messages.create({
            clienteLinkedinId,
            agentId,
            direction: item.direction,
            sender: item.sender ?? null,
            message: item.message,
            timeLabel,
            occurredAt,
            fingerprint,
          }),
        );
        saved.push(created);
        await this.deleteSiblingDuplicates(
          clienteLinkedinId,
          agentId,
          fingerprint,
          created.id,
          item.message,
          item.direction,
        );
      }
    }

    /** Chat existente (lote ou received) ⇒ conexão aceita na base. */
    const provesConnected =
      Boolean(dto.messages?.length) ||
      deduped.some(
        (i) => i.direction === ClientLinkedinMessageDirection.RECEIVED,
      );
    if (provesConnected && saved.length) {
      await this.ensureConnectionConnected(clienteLinkedinId, agentId);
    }

    return { ok: true, count: saved.length, data: saved };
  }

  private itemMetaScore(item: ClientLinkedinMessageItemDto): number {
    return (
      senderRank(item.sender) * 10 +
      (item.timeLabel || item.time ? 3 : 0) +
      directionRank(item.direction) +
      Math.min(normalizeMessageBody(item.message).length, 500) / 100
    );
  }

  private dedupeBatchItems(
    items: ClientLinkedinMessageItemDto[],
  ): ClientLinkedinMessageItemDto[] {
    const out: ClientLinkedinMessageItemDto[] = [];
    for (const item of items) {
      if (!normalizeMessageBody(item.message)) continue;
      const idx = out.findIndex((o) =>
        sameMessageBubble(
          o.message,
          item.message,
          o.direction,
          item.direction,
        ),
      );
      if (idx < 0) {
        out.push(item);
        continue;
      }
      if (this.itemMetaScore(item) >= this.itemMetaScore(out[idx])) {
        out[idx] = item;
      }
    }
    return out;
  }

  private async findExistingMessage(
    clienteLinkedinId: string,
    agentId: string,
    fingerprint: string,
    message: string,
    direction: string,
  ): Promise<ClientLinkedinMessage | null> {
    const byFp = await this.messages.findOneBy({
      clienteLinkedinId,
      agentId,
      fingerprint,
    });
    if (byFp) return byFp;

    const siblings = await this.messages.find({
      where: { clienteLinkedinId, agentId },
    });
    return (
      siblings.find((m) =>
        sameMessageBubble(m.message, message, m.direction, direction),
      ) ?? null
    );
  }

  /** Remove cópias antigas (mesmo sentido + texto). */
  private async deleteSiblingDuplicates(
    clienteLinkedinId: string,
    agentId: string,
    fingerprint: string,
    keepId: string,
    message: string,
    direction: string,
  ): Promise<void> {
    const siblings = await this.messages.find({
      where: { clienteLinkedinId, agentId },
    });
    const trash = siblings.filter(
      (m) =>
        m.id !== keepId &&
        (m.fingerprint === fingerprint ||
          sameMessageBubble(m.message, message, m.direction, direction)),
    );
    if (trash.length) {
      await this.messages.remove(trash);
    }
  }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    agentId?: string;
    profileUrl?: string;
    clienteLinkedinId?: string;
    direction?: string;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: ClientLinkedinMessage[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts?.limit) || 50));

    const qb = this.messages
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.clienteLinkedin', 'li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .orderBy('m.occurredAt', 'DESC', 'NULLS LAST')
      .addOrderBy('m.createdAt', 'DESC');

    if (opts?.agentId?.trim()) {
      qb.andWhere('m.agentId = :agentId', { agentId: opts.agentId.trim() });
    }
    if (opts?.clienteLinkedinId) {
      qb.andWhere('m.clienteLinkedinId = :cid', {
        cid: opts.clienteLinkedinId,
      });
    }
    if (opts?.profileUrl?.trim()) {
      qb.andWhere('li.profileUrl = :purl', {
        purl: normalizeProfileUrl(opts.profileUrl),
      });
    }
    if (opts?.direction === 'sent' || opts?.direction === 'received') {
      qb.andWhere('m.direction = :dir', { dir: opts.direction });
    }

    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);
    const data = await qb
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    return {
      meta: { total, page: safePage, limit, pages },
      data,
    };
  }

  /**
   * Envio outbound exige `client_connection_linkedin.status === 2` (conectado).
   * Lote (`messages[]`) de leitura do chat não passa por aqui.
   */
  private async assertConnectionAccepted(
    clienteLinkedinId: string,
    agentId: string,
  ): Promise<void> {
    const row = await this.connections.findOneBy({
      clienteLinkedinId,
      agentId,
    });
    if (!row) {
      throw new ForbiddenException(
        'conexão não encontrada; só é possível enviar mensagem após aceite (status conectado)',
      );
    }
    if (row.status !== ClientConnectionLinkedinStatus.CONNECTED) {
      throw new ForbiddenException(
        `conexão ainda não aceita (status=${row.status}); só envia com status conectado (2)`,
      );
    }
  }

  /** Upsert conexão agente↔perfil como conectado (chat LinkedIn implica aceite). */
  private async ensureConnectionConnected(
    clienteLinkedinId: string,
    agentId: string,
  ): Promise<void> {
    const existing = await this.connections.findOneBy({
      clienteLinkedinId,
      agentId,
    });
    if (existing) {
      if (existing.status !== ClientConnectionLinkedinStatus.CONNECTED) {
        existing.status = ClientConnectionLinkedinStatus.CONNECTED;
        existing.connectedAt = existing.connectedAt ?? new Date();
        await this.connections.save(existing);
      }
      return;
    }
    await this.connections.save(
      this.connections.create({
        clienteLinkedinId,
        agentId,
        status: ClientConnectionLinkedinStatus.CONNECTED,
        connectedAt: new Date(),
        invitedAt: null,
        steps: ['auto-from-messages'],
      }),
    );
  }

  private normalizeItems(
    dto: UpsertClientLinkedinMessagesDto,
  ): ClientLinkedinMessageItemDto[] {
    if (dto.messages?.length) return dto.messages;
    if (dto.message && dto.direction) {
      return [
        {
          direction: dto.direction,
          message: dto.message,
          sender: dto.sender,
          time: dto.time,
          timeLabel: dto.timeLabel,
          occurredAt: dto.occurredAt,
        },
      ];
    }
    return [];
  }

  private async ensureClienteLinkedinId(
    dto: UpsertClientLinkedinMessagesDto,
  ): Promise<string> {
    if (dto.clienteLinkedinId) {
      const row = await this.clienteLinkedin.findOneBy({
        id: dto.clienteLinkedinId,
      });
      if (!row) {
        throw new BadRequestException(
          `cliente_linkedin não encontrado: ${dto.clienteLinkedinId}`,
        );
      }
      return row.id;
    }

    const profileUrl = normalizeProfileUrl(dto.profileUrl || '');
    if (!profileUrl || !/linkedin\.com\/in\//i.test(profileUrl)) {
      throw new BadRequestException(
        'passe clienteLinkedinId ou profileUrl linkedin.com/in/…',
      );
    }

    let row = await this.clienteLinkedin.findOneBy({ profileUrl });
    if (row) return row.id;

    const nome =
      String(dto.peerName || '').trim() || slugFromProfileUrl(profileUrl);
    const cliente = await this.clientes.save(
      this.clientes.create({ nome }),
    );
    row = await this.clienteLinkedin.save(
      this.clienteLinkedin.create({
        clienteId: cliente.id,
        profileUrl,
      }),
    );
    return row.id;
  }
}
