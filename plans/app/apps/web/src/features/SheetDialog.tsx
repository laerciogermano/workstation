// Janela de uma planilha anexada: ver, editar e salvar. Carregada só quando alguém abre uma.
import 'react-data-grid/lib/styles.css';
import type { Side } from '@plans/domain';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react';
import { DataGrid, type Column, type RenderEditCellContentProps } from 'react-data-grid';
import { ConflictError } from '../folder/project.ts';
import { addAttachmentCopy, readAttachment, saveAttachment, useApp } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { parseTable } from './preview.ts';
import { columnName, deleteColumn, deleteRow, insertColumn, insertRow, openBook, setCell, type Book, type Row, type Sheet } from './sheetFile.ts';

type Opened = { book: Book; source: Blob };
/** `saved`: o que está no arquivo. `past`: para desfazer. */
type History = { sheets: Sheet[]; saved: Sheet[]; past: Sheet[][] };
type Props = { nodeId: string; side: Side; name: string; dark: boolean; onClose: () => void };

const UNDO_LIMIT = 100;
const NOTHING: Sheet[] = [];

/** Lê os bytes na hora: o arquivo da pasta deixa de ser legível quando muda no disco. */
async function open(name: string, file: Blob): Promise<Opened> {
  const source = new Blob([await file.arrayBuffer()]);
  return { source, book: await openBook(name, source) };
}

function CellEditor({ row, column, onRowChange, onClose }: RenderEditCellContentProps<Row>) {
  const c = Number(column.key);
  const input = useRef<HTMLInputElement>(null);
  // como numa planilha: o texto entra selecionado, e digitar por cima troca
  useLayoutEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  const set = (value: string) => {
    const cells = Array.from({ length: Math.max(row.cells.length, c + 1) }, (_, i) => row.cells[i] ?? '');
    cells[c] = value;
    const shown = { ...row.shown };
    delete shown[c];
    onRowChange({ ...row, cells, shown });
  };
  return (
    <input
      className="sheet-input"
      aria-label={`Célula ${column.name}`}
      ref={input}
      value={row.cells[c] ?? ''}
      onChange={(e) => set(e.target.value)}
      onBlur={() => onClose(true, false)}
      // ⌘S com o editor aberto: confirma o texto antes de salvar
      onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && onClose(true, true)}
    />
  );
}

export default function SheetDialog({ nodeId, side, name, dark, onClose }: Props) {
  const app = useApp();
  const [opened, setOpened] = useState<Opened | null>(null);
  const [history, setHistory] = useState<History>({ sheets: NOTHING, saved: NOTHING, past: [] });
  const [tab, setTab] = useState(0);
  const [at, setAt] = useState<{ r: number; c: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; warn?: boolean; conflict?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [saveAsked, setSaveAsked] = useState(0);
  const [download, setDownload] = useState('');

  const show = (next: Opened) => {
    setOpened(next);
    setHistory({ sheets: next.book.sheets, saved: next.book.sheets, past: [] });
  };

  useEffect(() => {
    let alive = true;
    readAttachment(nodeId, side, name)
      .then((file) => open(name, file))
      .then((next) => alive && show(next))
      .catch((e: Error) => alive && setMessage({ text: `Não deu para abrir o arquivo. ${e.message}`, warn: true }));
    return () => void (alive = false);
  }, [nodeId, side, name]);

  useEffect(() => {
    if (!opened) return;
    // sempre como arquivo comum: baixar nunca abre o conteúdo como página
    const url = URL.createObjectURL(new Blob([opened.source], { type: 'application/octet-stream' }));
    setDownload(url);
    return () => URL.revokeObjectURL(url);
  }, [opened]);

  const book = opened?.book;
  const editable = !!book && !book.readOnly && !app.readOnly;
  const dirty = history.sheets !== history.saved;
  const sheet = history.sheets[tab];

  /** Troca a aba atual; a anterior fica guardada para desfazer. */
  const change = (edit: (sheet: Sheet) => Sheet) => {
    setLeaving(false);
    setMessage((m) => (m?.warn ? m : null)); // "salvo" já não vale
    setHistory((h) => {
      const next = edit(h.sheets[tab]!);
      if (next === h.sheets[tab]) return h;
      return { ...h, sheets: h.sheets.with(tab, next), past: [...h.past.slice(1 - UNDO_LIMIT), h.sheets] };
    });
  };
  const undo = () => setHistory((h) => (h.past.length ? { ...h, sheets: h.past.at(-1)!, past: h.past.slice(0, -1) } : h));

  const save = async (asCopy = false) => {
    if (!opened || !editable || saving || (!dirty && !asCopy)) return;
    const sheets = history.sheets;
    setSaving(true);
    setMessage(null);
    try {
      const data = await opened.book.write(sheets);
      const copyName = opened.book.copyName ?? (asCopy ? name : null);
      if (copyName) {
        const created = await addAttachmentCopy(nodeId, side, copyName, data);
        setHistory((h) => ({ ...h, saved: sheets }));
        setMessage({ text: `Cópia salva nos anexos: ${created}` });
      } else {
        await saveAttachment(nodeId, side, name, opened.source, data);
        // relê o que foi gravado, mantendo o que se digitou enquanto gravava
        const next = await open(name, data);
        setOpened(next);
        setHistory((h) => (h.sheets === sheets ? { sheets: next.book.sheets, saved: next.book.sheets, past: [] } : h));
        setMessage({ text: 'Salvo no arquivo. A versão anterior foi para a lixeira.' });
      }
      setLeaving(false);
    } catch (e) {
      console.error(e);
      setMessage(
        e instanceof ConflictError
          ? { text: 'O arquivo mudou ou foi removido fora desta tela. Nada foi sobrescrito.', warn: true, conflict: true }
          : { text: `Não deu para salvar. ${(e as Error).message}`, warn: true },
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => (dirty ? setLeaving(true) : onClose());

  // o pedido vindo do teclado roda depois do desenho, já com o texto da célula confirmado
  useEffect(() => {
    if (saveAsked) void save();
  }, [saveAsked]);

  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      setSaveAsked((n) => n + 1);
    } else if (e.key === 'Escape') {
      // na grade, Esc só desiste da célula; fora dela, fecha (perguntando se há alterações)
      e.preventDefault();
      if (!(e.target as Element).closest?.('.rdg')) close();
    }
  };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const columnCount = sheet?.columns ?? 0;
  const locked = sheet?.locked;
  const columns = useMemo<Column<Row>[]>(
    () => [
      { key: 'n', name: '', width: 56, minWidth: 56, frozen: true, cellClass: 'sheet-n', renderCell: ({ rowIdx }) => rowIdx + 1 },
      ...Array.from({ length: columnCount }, (_, c): Column<Row> => ({
        key: String(c),
        name: columnName(c),
        width: 140,
        resizable: true,
        editable: editable ? (row) => !locked?.has(`${row.id},${c}`) : false,
        renderCell: ({ row }) => row.shown?.[c] ?? row.cells[c] ?? '',
        renderEditCell: CellEditor,
      })),
    ],
    [columnCount, editable, locked],
  );

  /** Cola um bloco copiado de outra planilha a partir da célula escolhida. */
  const paste = (r: number, c: number, e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    e.preventDefault();
    const block = parseTable(text, 'colado.tsv', Infinity).rows;
    change((s) => block.reduce((sheet, line, i) => line.reduce((acc, value, j) => setCell(acc, r + i, c + j, value), sheet), s));
  };

  const raw = at && sheet ? (sheet.rows[at.r]?.cells[at.c] ?? '') : '';

  return (
    <Dialog
      full
      title={`${name}${dirty ? ' •' : ''}`}
      onClose={onClose}
      actions={
        <>
          {download && <a className="btn" href={download} download={name}>Baixar</a>}
          {editable && (
            <button type="button" className="btn pri" disabled={saving} aria-disabled={!dirty} title="⌘S ou Ctrl+S" onClick={() => setSaveAsked((n) => n + 1)}>
              {saving ? 'Salvando…' : book.copyName ? 'Salvar cópia .xlsx' : 'Salvar'}
            </button>
          )}
          <button type="button" className="btn" onClick={close}>Fechar</button>
        </>
      }
    >
      {editable && sheet && (
        <div className="sheet-tools" role="toolbar" aria-label="Edição da planilha">
          <button type="button" className="btn" disabled={!history.past.length} onClick={undo}>Desfazer</button>
          {book.text ? (
            <>
              <button type="button" className="btn" disabled={!at} onClick={() => change((s) => insertRow(s, at!.r))}>Inserir linha acima</button>
              <button type="button" className="btn" disabled={!at || !sheet.rows[at.r]} onClick={() => change((s) => deleteRow(s, at!.r))}>Excluir linha</button>
              <button type="button" className="btn" disabled={!at} onClick={() => change((s) => insertColumn(s, at!.c))}>Inserir coluna antes</button>
              <button type="button" className="btn" disabled={!at || columnCount < 2} onClick={() => (change((s) => deleteColumn(s, at!.c)), setAt(null))}>Excluir coluna</button>
            </>
          ) : null}
          <button type="button" className="btn" onClick={() => change((s) => insertRow(s, s.rows.length))}>+ Linha</button>
          <button type="button" className="btn" onClick={() => change((s) => insertColumn(s, s.columns))}>+ Coluna</button>
        </div>
      )}
      {/* sempre no lugar: se aparecesse no primeiro clique, a grade desceria e o segundo cairia em outra célula */}
      <p className="sheet-cell">
        <b>{at && `${columnName(at.c)}${at.r + 1}`}</b>
        <span>{raw}</span>
      </p>
      <div className="sheet-grid">
        {sheet ? (
          <DataGrid
            key={tab}
            className={dark ? 'rdg-dark' : 'rdg-light'}
            aria-label={name}
            columns={columns}
            rows={sheet.rows}
            getRowKey={(row) => row.id}
            rowHeight={30}
            headerRowHeight={30}
            // setCell ignora o que não mudou, então abrir e fechar o editor não suja o arquivo
            onRowsChange={(rows, { indexes, column }) => change((s) => indexes.reduce((acc, i) => setCell(acc, i, Number(column.key), rows[i]!.cells[Number(column.key)] ?? ''), s))}
            onActivePositionChange={({ rowIdx, column }) => setAt(column && column.key !== 'n' && rowIdx >= 0 ? { r: rowIdx, c: Number(column.key) } : null)}
            onCellCopy={({ row, column }, e) => {
              if (column.key === 'n' || window.getSelection()?.toString()) return;
              e.clipboardData.setData('text/plain', row.cells[Number(column.key)] ?? '');
              e.preventDefault();
            }}
            onCellPaste={({ row, column }, e) => {
              if (editable && column.key !== 'n') paste(sheet.rows.indexOf(row), Number(column.key), e);
              return row;
            }}
            onCellKeyDown={(args, e) => {
              if (args.mode !== 'ACTIVE' || !editable || !args.column || args.column.key === 'n') return;
              const key = e.key.toLowerCase();
              if (key === 'delete' || key === 'backspace') {
                e.preventGridDefault();
                e.preventDefault();
                change((s) => setCell(s, args.rowIdx, Number(args.column!.key), ''));
              } else if ((e.metaKey || e.ctrlKey) && key === 'z') {
                e.preventGridDefault();
                e.preventDefault();
                undo();
              }
            }}
          />
        ) : (
          !message && <p className="muted">Abrindo…</p>
        )}
      </div>
      {history.sheets.length > 1 && (
        <div className="md-tabs sheet-tabs" role="radiogroup" aria-label="Planilha">
          {history.sheets.map((s, i) => <button key={s.name} type="button" role="radio" aria-checked={tab === i} onClick={() => (setTab(i), setAt(null))}>{s.name}</button>)}
        </div>
      )}
      {book && (book.readOnly || book.note) && <p className="muted small">{book.readOnly ?? book.note}</p>}
      {sheet?.formulas && <p className="muted small">Fórmulas mostram o último resultado salvo; o Excel recalcula ao abrir. Escreva-as em inglês e com vírgula: =SUM(A1,B2).</p>}
      {message && (
        <div className={message.warn ? 'note warn' : 'status'} role={message.warn ? 'alert' : 'status'}>
          {message.text}
          {message.conflict && <button type="button" className="btn" onClick={() => void save(true)}>Salvar como cópia</button>}
        </div>
      )}
      {leaving && dirty && (
        <div className="note warn" role="alert">
          Há alterações não salvas.
          <button type="button" className="btn danger" onClick={onClose}>Descartar e fechar</button>
          <button type="button" className="btn" onClick={() => setLeaving(false)}>Continuar editando</button>
        </div>
      )}
    </Dialog>
  );
}
