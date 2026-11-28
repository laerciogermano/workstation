// Editor de Markdown da descrição (@uiw/react-md-editor). Carregado só quando um painel o usa.
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight';
import type { ComponentProps, KeyboardEvent } from 'react';
import rehypeSanitize from 'rehype-sanitize';

export type DescriptionMode = 'read' | 'edit' | 'split';

const named = (command: ICommand, label: string): ICommand => ({ ...command, buttonProps: { 'aria-label': label, title: label } });
const TOOLBAR: ICommand[] = [
  named(commands.bold, 'Negrito'),
  named(commands.italic, 'Itálico'),
  named(commands.strikethrough, 'Riscado'),
  commands.divider,
  { ...named(commands.title2, 'Título'), icon: <b className="md-h">H2</b> },
  { ...named(commands.title3, 'Subtítulo'), icon: <b className="md-h">H3</b> },
  commands.divider,
  named(commands.unorderedListCommand, 'Lista'),
  named(commands.orderedListCommand, 'Lista numerada'),
  named(commands.checkedListCommand, 'Lista de tarefas'),
  commands.divider,
  named(commands.link, 'Link'),
  named(commands.quote, 'Citação'),
  named(commands.code, 'Código'),
  named(commands.codeBlock, 'Bloco de código'),
  named(commands.table, 'Tabela'),
];

const external = (url = '') => /^(https?:|mailto:)/i.test(url);

/**
 * A descrição vem de um arquivo que qualquer um pode editar: HTML é descartado, imagens de fora não são baixadas
 * (avisariam terceiros) e links relativos não tiram a pessoa do app.
 */
const preview: ComponentProps<typeof MDEditor.Markdown> = {
  rehypePlugins: [rehypeSanitize],
  disableCopy: true,
  components: {
    a: ({ href, children, title }) =>
      external(href) ? (
        <a href={href} title={title} target="_blank" rel="noopener noreferrer">{children}</a>
      ) : href?.startsWith('#') ? (
        <a href={href}>{children}</a>
      ) : (
        <span className="md-local" title={`Arquivo da pasta: ${href ?? ''}`}>{children}</span>
      ),
    img: ({ src, alt }) =>
      typeof src === 'string' && external(src) ? (
        <a href={src} target="_blank" rel="noopener noreferrer">Imagem: {alt || src}</a>
      ) : (
        <span className="md-local" title={`Imagem: ${typeof src === 'string' ? src : ''}`}>Imagem: {alt || 'sem descrição'}</span>
      ),
  },
};

export type MarkdownEditorProps = {
  value: string;
  mode: DescriptionMode;
  readOnly: boolean;
  dark: boolean;
  height: number | string;
  onChange: (value: string) => void;
  /** ⌘S ou Ctrl+Enter */
  onSave: () => void;
  /** dois cliques na leitura */
  onEdit: () => void;
};

export default function MarkdownEditor({ value, mode, readOnly, dark, height, onChange, onSave, onEdit }: MarkdownEditorProps) {
  return (
    <div className={`md mode-${mode}`} data-color-mode={dark ? 'dark' : 'light'}>
      {mode === 'read' ? (
        <div className="md-read" role="document" aria-label="Descrição formatada" onDoubleClick={() => !readOnly && onEdit()} style={{ minHeight: 80 }}>
          {value.trim() ? <MDEditor.Markdown source={value} {...preview} /> : <p className="muted">Sem descrição.{!readOnly && ' Dois cliques para escrever.'}</p>}
        </div>
      ) : (
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? '')}
          preview={mode === 'split' ? 'live' : 'edit'}
          height={height}
          visibleDragbar={false}
          commands={TOOLBAR}
          extraCommands={[]}
          previewOptions={preview}
          textareaProps={{
            'aria-label': 'Descrição',
            placeholder: 'Contexto para quem vai executar (aceita Markdown)',
            maxLength: 100_000,
            readOnly,
            onKeyDown: (e: KeyboardEvent) => {
              if ((e.metaKey || e.ctrlKey) && (e.key === 'Enter' || e.key.toLowerCase() === 's')) {
                e.preventDefault();
                onSave();
              }
            },
          }}
        />
      )}
    </div>
  );
}
