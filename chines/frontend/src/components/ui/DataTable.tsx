type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = 'Nenhum registro encontrado.',
}: Props<T>) {
  if (data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
