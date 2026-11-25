"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Info, XCircle } from "lucide-react";
import { CLASS_COLORS, CLASS_LABELS, COLORS, PRIORITY_COLORS, SEVERITY_COLORS } from "@/lib/constants";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({ title, subtitle, children, right }: { title: string; subtitle?: string; children?: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function KpiRow({ items }: { items: { label: string; value: ReactNode; sub?: string; accent?: string }[] }) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
     {/* -mr-px/-mb-px hide the outer cell borders, so any empty slot in the last row stays white */}
     <div className="-mb-px -mr-px grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
      {items.map((k) => (
        <div key={k.label} className="border-b border-r border-slate-200 px-4 py-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {k.accent && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: k.accent }} />}
            {k.label}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{k.value}</div>
          {k.sub && <div className="mt-0.5 text-xs text-slate-500">{k.sub}</div>}
        </div>
      ))}
     </div>
    </div>
  );
}

/** Soft, tinted badge: light background + coloured text, the style used by most real SaaS products. */
export function Badge({ children, color = COLORS.primary, soft = false }: { children: ReactNode; color?: string; soft?: boolean }) {
  const c = soft ? COLORS.primary : color;
  return (
    <span className="mr-1.5 inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ color: c, background: `${c}14`, boxShadow: `inset 0 0 0 1px ${c}33` }}>
      {children}
    </span>
  );
}
export const SeverityBadge = ({ s }: { s: string }) => <Badge color={SEVERITY_COLORS[s] ?? "#64748B"}>{s}</Badge>;
export const ClassBadge = ({ c }: { c: string }) => <Badge color={CLASS_COLORS[c] ?? "#64748B"}>{CLASS_LABELS[c] ?? c}</Badge>;
export const PriorityBadge = ({ p }: { p: string }) => <Badge color={PRIORITY_COLORS[p.slice(0, 2)] ?? "#64748B"}>{p}</Badge>;

export function Meter({ value, color = COLORS.primary }: { value: number; color?: string }) {
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, background: color }} />
    </div>
  );
}

function Callout({ tone, icon, children }: { tone: string; icon: ReactNode; children: ReactNode }) {
  return <div className={`my-2 flex gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${tone}`}><span className="mt-0.5 shrink-0">{icon}</span><div className="min-w-0 flex-1">{children}</div></div>;
}

export function Note({ children, warn = false }: { children: ReactNode; warn?: boolean }) {
  return warn
    ? <Callout tone="border-amber-200 bg-amber-50 text-amber-900" icon={<AlertTriangle size={16} className="text-amber-600" />}>{children}</Callout>
    : <Callout tone="border-slate-200 bg-slate-50 text-slate-700" icon={<Info size={16} className="text-slate-500" />}>{children}</Callout>;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <Callout tone="border-red-200 bg-red-50 text-red-800" icon={<XCircle size={16} className="text-red-600" />}>{children}</Callout>;
}

export function SuccessBox({ children }: { children: ReactNode }) {
  return <Callout tone="border-emerald-200 bg-emerald-50 text-emerald-800" icon={<CheckCircle2 size={16} className="text-emerald-600" />}>{children}</Callout>;
}

export function Quote({ text, meta }: { text: string; meta?: string }) {
  return (
    <div className="my-1.5 border-l-2 border-slate-200 py-0.5 pl-3 text-sm text-slate-700">
      “{text}” {meta && <span className="ml-1 text-xs text-slate-400">{meta}</span>}
    </div>
  );
}

export function Btn({ variant = "secondary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50";
  const v = variant === "primary" ? "bg-slate-900 text-white hover:bg-slate-800"
    : variant === "danger" ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return <button {...p} className={`${base} ${v} ${className}`} />;
}

export function Tabs({ tabs, children }: { tabs: string[]; children: (active: string) => ReactNode }) {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${active === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {t}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" /> {label ?? "Loading…"}
    </div>
  );
}

export function Expander({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
        <ChevronRight size={15} className={`shrink-0 text-slate-400 transition ${open ? "rotate-90" : ""}`} /> {title}
      </button>
      {open && <div className="border-t border-slate-100 px-3.5 py-3">{children}</div>}
    </div>
  );
}

export function Table({ head, children, className = "" }: { head: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-500">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-3 py-2.5 align-top text-slate-700 ${className}`}>{children}</td>;

export function Bar({ value, color = COLORS.primary, label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>
      <span className="w-8 tabular-nums text-slate-700">{label ?? value.toFixed(0)}</span>
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-slate-700">
      <div className="flex justify-between"><span>{label}</span><span className="font-medium tabular-nums text-slate-900">{value}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-slate-900" />
    </label>
  );
}

export function MultiSelect({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mb-3">
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <button onClick={() => setOpen(!open)} className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-sm text-slate-800 shadow-sm hover:border-slate-300">
        {value.length === 0 ? <span className="text-slate-500">All</span> : value.map((v) => (
          <span key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">{options.find((o) => o.value === v)?.label ?? v}</span>
        ))}
        <ChevronDown size={14} className="ml-auto shrink-0 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
            {options.map((o) => {
              const on = value.includes(o.value);
              return (
                <button key={o.value} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-800 hover:bg-slate-100">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>{on && <Check size={11} strokeWidth={3} />}</span>
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })}
            {value.length > 0 && <button onClick={() => onChange([])} className="mt-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-slate-600 hover:bg-slate-100">Clear</button>}
          </div>
        </>
      )}
    </div>
  );
}
