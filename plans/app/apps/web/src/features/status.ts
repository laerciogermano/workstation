import type { LinkState } from '../connection/hub.ts';

export function linkLabel(s: LinkState): string {
  switch (s.state) {
    case 'unpaired': return 'Client não pareado';
    case 'connecting': return 'Conectando ao hub…';
    case 'hub-offline': return 'Hub fora do ar, tentando de novo';
    case 'hub-refused': return `O hub recusou a conexão (${s.code})`;
    case 'waiting-client': return 'Aguardando o client';
    case 'wrong-project': return 'Client pareado com outra pasta';
    case 'ready': return `Client conectado · ${({ darwin: 'macOS', windows: 'Windows', linux: 'Linux' } as Record<string, string>)[s.info.os] ?? s.info.os} ${s.info.arch}`;
  }
}
