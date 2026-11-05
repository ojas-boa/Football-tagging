import { ReactNode } from 'react';
import { Ratio, pct } from '../lib/stats';

export function Section({ id, title, subtitle, children }: { id?: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={id} className="report-section bg-white rounded-lg border border-slate-200 p-5 mb-5">
      <div className="flex items-baseline justify-between mb-3 border-b border-slate-200 pb-2">
        <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-slate-700">{title}</h2>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

export function RatioCell({ r, showPct = true }: { r: Ratio; showPct?: boolean }) {
  if (!r.total) return <span className="text-slate-300">0</span>;
  return (
    <span>
      {r.total}/{r.ok}
      {showPct && <span className="text-slate-400 text-[10px] ml-1">{pct(r)}%</span>}
    </span>
  );
}

export function Legend({ items }: { items: { label: string; swatch: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-2">
      {items.map(i => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.swatch}
          {i.label}
        </span>
      ))}
    </div>
  );
}

export const C_OK = '#2563eb';
export const C_FAIL = '#dc2626';
