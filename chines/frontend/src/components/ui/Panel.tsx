type Props = {
  title: string;
  children: React.ReactNode;
};

export function Panel({ title, children }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">{title}</div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
