// Ícone do responsável, conforme o tipo em assignees.json. O nome acompanha o ícone em texto.
import type { Assignee } from '@plans/domain';
import { Icon } from './Icon.tsx';

const ICON = { person: 'user', ai: 'bot', machine: 'terminal', none: 'userNone', unknown: 'userUnknown' } as const;

/** `none`: sem responsável; `unknown`: id que não está em assignees.json. */
export function AssigneeIcon({ type, size = 14 }: { type: Assignee['type'] | 'none' | 'unknown'; size?: number }) {
  return <Icon name={ICON[type]} size={size} />;
}
