import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAction, useApp, useEv } from '../app-context';
import { ago, dayKey, dayNumber, firstName, fmt, time, weekShort } from '../format';
import { Icon } from '../icons';
import { Avatar, Empty, Load, Page } from '../ui';

interface Thread { id: string; title: string; photo?: string | null; startsAt?: string; lastBody: string | null; lastAt: string | null; lastAuthor?: string; lastMine: boolean | null; unread: number }
const preview = (t: Thread) => (t.lastBody ? `${t.lastMine ? 'Você: ' : t.lastAuthor ? `${firstName(t.lastAuthor)}: ` : ''}${t.lastBody}` : 'Grupo criado. Diga olá.');

export function ChatList() {
  const q = useEv<{ groups: Thread[]; direct: Thread[]; locked: number }>('/chats'), navigate = useNavigate();
  const [tab, setTab] = useState(() => sessionStorage.getItem('aba-chat') ?? 'grupos');
  const pick = (t: string) => { sessionStorage.setItem('aba-chat', t); setTab(t); };
  const row = (t: Thread, group: boolean) => (
    <button key={t.id} className={`thread ${t.unread ? 'unread' : ''}`} onClick={() => navigate(`/chat/${t.id}`)}>
      {group ? <span className="gtile"><b className="cond num">{dayNumber(t.startsAt!)}</b><span>{weekShort(t.startsAt!).toUpperCase()}</span></span> : <Avatar name={t.title} photo={t.photo} />}
      <div><div className="name">{t.title}</div><div className="last">{preview(t)}</div></div>
      <div className="when"><span className="num">{t.lastAt ? ago(t.lastAt) : ''}</span>{t.unread > 0 && <span className="badge num">{t.unread}</span>}</div>
    </button>
  );
  return (
    <Page title="Chat" tab="/chat">
      <div className="seg" role="group" aria-label="Tipo de conversa">
        <button aria-pressed={tab === 'grupos'} onClick={() => pick('grupos')}>Grupos dos eventos</button><button aria-pressed={tab === 'privadas'} onClick={() => pick('privadas')}>Privadas</button></div>
      <Load q={q}>{(d) => tab === 'grupos' ? <>
        {d.groups.length > 0 && <div className="threads">{d.groups.map((t) => row(t, true))}</div>}
        {d.locked > 0 && <div className="locked"><Icon n="lock" /><span>Mais <b className="num">{d.locked}</b> grupos abrem quando você se inscreve nos eventos.</span></div>}
      </> : <>
        {d.direct.length > 0 ? <div className="threads">{d.direct.map((t) => row(t, false))}</div> : <Empty text="Nenhuma conversa privada ainda." />}
        <p className="hint-line">Para falar com outro irmão, abra os participantes de um evento.</p>
      </>}</Load>
    </Page>
  );
}

interface Convo {
  chat: { id: string; type: 'group' | 'direct'; title: string; subtitle: string; photo?: string | null; startsAt?: string; members?: number };
  messages: { id: string; body: string; sentAt: string; author: string; mine: boolean }[];
}
export function Conversation() {
  const { id } = useParams(), q = useEv<Convo>(`/chats/${id}/messages`), { path, eventId } = useApp(), navigate = useNavigate(), run = useAction(), client = useQueryClient();
  const [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null), count = q.data?.messages.length;
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
    client.invalidateQueries({ queryKey: ['ev', eventId, '/context'] }); // ler zera o contador de não lidas
  }, [count, client, eventId]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    if (await run(() => api('POST', path(`/chats/${id}/messages`), { body: text }))) setText('');
    setBusy(false);
  }
  if (!q.data) return <Page title="Conversa" back="/chat"><Load q={q}>{() => null}</Load></Page>;
  const { chat, messages } = q.data, group = chat.type === 'group';
  return (
    <main className="view" style={{ overflow: 'hidden' }}><div className="convo">
      <div className="convo-head"><button className="icon-btn" onClick={() => navigate('/chat')} aria-label="Voltar"><Icon n="chevron-left" /></button>
        <div className="who">{group ? <span className="gtile"><b className="cond num">{dayNumber(chat.startsAt!)}</b></span> : <Avatar name={chat.title} photo={chat.photo} />}
          <div style={{ minWidth: 0 }}><span className="name">{chat.title}</span><small>{group ? `${fmt(chat.members!)} participantes · ` : ''}{chat.subtitle}</small></div></div></div>
      <div className="msgs" ref={box}>{messages.length === 0 && <p className="hint-line center">Nenhuma mensagem ainda. Diga olá.</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1], newDay = !prev || dayKey(prev.sentAt) !== dayKey(m.sentAt), same = !newDay && prev.author === m.author;
          const label = dayKey(m.sentAt) === dayKey(new Date().toISOString()) ? 'Hoje' : dayKey(m.sentAt).split('-').reverse().slice(0, 2).join('/');
          return [newDay && <span key={`d${m.id}`} className="daymark" style={{ marginTop: i ? 16 : 0 }}>{label}</span>,
            <div key={m.id} className={`msg ${m.mine ? 'me' : ''} ${same ? 'same' : ''}`}>{group && !m.mine && !same && <span className="who">{m.author}</span>}<div className="bubble">{m.body}</div><span className="at num">{time(m.sentAt)}</span></div>];
        })}</div>
      <form className="composer" onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Mensagem" aria-label="Mensagem" autoComplete="off" /><button type="submit" aria-label="Enviar"><Icon n="arrow-up" /></button></form>
    </div></main>
  );
}
