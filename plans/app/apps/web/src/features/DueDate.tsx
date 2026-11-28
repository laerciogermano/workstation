// Data de entrega no cartão do Kanban, com o atraso em destaque. No painel, o campo é o DateField.
import { localDay, type Activity } from '@plans/domain';

export type DueState = 'late' | 'today' | 'ahead' | 'done';

/** Dias AAAA-MM-DD comparados como texto, sem hora nem fuso. Entregue não atrasa. */
export function dueState(day: string, today: string, done: boolean): DueState {
  if (done) return 'done';
  if (day < today) return 'late';
  return day === today ? 'today' : 'ahead';
}

/** `05/12`; o ano só aparece quando não é o de hoje. */
export function dueLabel(day: string, today: string): string {
  const [year, month, date] = day.split('-');
  return `${date}/${month}${today.startsWith(`${year}-`) ? '' : `/${year}`}`;
}

const PREFIX: Record<DueState, string> = { late: 'Atrasada · ', today: 'Hoje · ', ahead: 'Entrega ', done: 'Entrega ' };

/** Sem data, o cartão não mostra nada. */
export function DueChip({ activity }: { activity: Activity }) {
  const { dueDate, status } = activity;
  if (!dueDate) return null;
  const today = localDay(new Date().toISOString())!;
  const state = dueState(dueDate, today, status === 'done');
  return (
    <time className={`due due-${state}`} dateTime={dueDate} title={`Data de entrega: ${dueLabel(dueDate, '')}`}>
      {PREFIX[state]}{dueLabel(dueDate, today)}
    </time>
  );
}
