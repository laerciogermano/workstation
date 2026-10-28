import { useEffect, useMemo, useState } from 'react';

export function useChartTheme() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((n) => n + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);
  return useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      tick: s.getPropertyValue('--muted').trim() || '#B4BCCC',
      grid: s.getPropertyValue('--border').trim() || '#262D3D',
      text: s.getPropertyValue('--text').trim() || '#FFFFFF',
      surface: s.getPropertyValue('--surface').trim() || '#151A26',
      accent: s.getPropertyValue('--accent').trim() || '#2563EB',
      accentSoft: s.getPropertyValue('--accent-soft').trim() || '#6EA2FF',
      _n: tick,
    };
  }, [tick]);
}

export function ChartPanel({
  title,
  children,
  wide = false,
  half = false,
  empty = false,
  emptyLabel,
  note,
}) {
  return (
    <section
      className={`dash-panel${wide ? ' dash-panel-wide' : ''}${half ? ' dash-panel-half' : ''}`}
    >
      <h2>{title}</h2>
      {note && <p className="panel-note">{note}</p>}
      {empty ? (
        <p className="muted">{emptyLabel ?? 'Sem dados'}</p>
      ) : (
        <div className="chart-box">{children}</div>
      )}
    </section>
  );
}

export function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label != null && label !== '' && (
        <div className="chart-tooltip-label">{label}</div>
      )}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="chart-tooltip-row">
          <span>
            <i className="swatch" style={{ background: p.color }} />
            {p.name ?? p.dataKey}
          </span>
          <strong>{format ? format(p.value, p) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}
