"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen, Database, FilterX, Lightbulb, Megaphone, Menu, MessagesSquare, Plus, Radar, Settings, Target, TrendingUp, LayoutDashboard, type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { SEVERITIES } from "@/lib/constants";
import { api } from "@/lib/api";
import { Btn, ErrorBox, MultiSelect } from "./ui";

const NAV: { group: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    group: "Insights",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/customers", label: "Customer Intelligence", icon: MessagesSquare },
      { href: "/company", label: "Company Communication", icon: Megaphone },
      { href: "/blind-spots", label: "Blind Spot Analysis", icon: Target },
      { href: "/trends", label: "Trend Analysis", icon: TrendingUp },
      { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
    ],
  },
  {
    group: "Workspace",
    items: [
      { href: "/data", label: "Data Management", icon: Database },
      { href: "/methodology", label: "Methodology & Limits", icon: BookOpen },
    ],
  },
];

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
const labelCls = "mb-1 text-xs font-medium text-slate-500";
const groupCls = "mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const app = useApp();
  const [menu, setMenu] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showApi, setShowApi] = useState(false);
  const [apiDraft, setApiDraft] = useState("");
  const v = app.view;

  async function createCompany() {
    setErr(null);
    try {
      const c = await api.createCompany(newName, newIndustry);
      await app.refreshCompanies();
      app.selectCompany(c.id);
      setNewName(""); setNewIndustry(""); setShowNew(false);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  const statusColor = app.apiStatus === "online" ? "bg-emerald-500" : app.apiStatus === "offline" ? "bg-red-500" : "bg-amber-500";

  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 text-slate-700">
      {/* Brand */}
      <div className="mb-5 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white"><Radar size={17} /></div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">Blind Spot Detector</div>
          <div className="text-xs text-slate-500">Customer intelligence</div>
        </div>
      </div>

      {/* Workspace: company + analysis */}
      <div className="mb-5 space-y-3 px-2">
        <div>
          <div className="flex items-center justify-between">
            <div className={labelCls}>Company</div>
            <button onClick={() => setShowNew(!showNew)} className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-slate-600 hover:text-slate-900"><Plus size={13} />New</button>
          </div>
          {app.companies.length > 0 ? (
            <select className={inputCls} value={app.company?.id ?? ""} onChange={(e) => app.selectCompany(Number(e.target.value))}>
              {app.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : <div className="text-xs text-slate-400">No companies yet</div>}
          {showNew && (
            <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <input className={inputCls} placeholder="Company name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input className={inputCls} placeholder="Industry (optional)" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} />
              <Btn variant="primary" className="w-full" disabled={!newName.trim()} onClick={createCompany}>Create company</Btn>
              {err && <div className="text-xs text-red-600">{err}</div>}
            </div>
          )}
        </div>
        {app.company && (
          <div>
            <div className={labelCls}>Analysis run</div>
            {app.sessions.some((s) => s.status === "completed") ? (
              <select className={inputCls} value={app.sessionId ?? ""} onChange={(e) => app.selectSession(Number(e.target.value))}>
                {app.sessions.filter((s) => s.status === "completed").map((s) => (
                  <option key={s.id} value={s.id}>#{s.id} · {s.started_at.slice(0, 16).replace("T", " ")} · {s.n_customer} conv.{s.is_synthetic ? " · demo" : ""}</option>
                ))}
              </select>
            ) : <div className="text-xs text-slate-400">No completed analysis yet</div>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-5">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className={groupCls}>{g.group}</div>
            <div className="space-y-0.5">
              {g.items.map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} onClick={() => setMenu(false)}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition ${active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-slate-900" : "text-slate-400"} />{n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Filters */}
      {v && app.bundle && (
        <div className="mt-6 border-t border-slate-200 px-2 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div className={groupCls.replace("mb-1.5 px-2", "")}>Filters</div>
            <button onClick={() => app.setFilters({ topics: [], sentiments: [], severities: [], sources: [], dateFrom: "", dateTo: "" })} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"><FilterX size={13} />Clear</button>
          </div>
          <MultiSelect label="Topic" options={app.bundle.topics.map((t) => ({ value: String(t.topic_id), label: t.label }))} value={app.filters.topics.map(String)} onChange={(x) => app.setFilters({ ...app.filters, topics: x.map(Number) })} />
          <MultiSelect label="Sentiment" options={["positive", "neutral", "negative"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} value={app.filters.sentiments} onChange={(x) => app.setFilters({ ...app.filters, sentiments: x })} />
          <MultiSelect label="Severity" options={SEVERITIES.map((s) => ({ value: s, label: s }))} value={app.filters.severities} onChange={(x) => app.setFilters({ ...app.filters, severities: x })} />
          <MultiSelect label="Data source" options={v.sources.map((s) => ({ value: s, label: s }))} value={app.filters.sources} onChange={(x) => app.setFilters({ ...app.filters, sources: x })} />
          {v.dateBounds ? (
            <div>
              <div className={labelCls}>Date range</div>
              <div className="grid gap-1.5">
                <input type="date" className={inputCls} min={v.dateBounds[0]} max={v.dateBounds[1]} value={app.filters.dateFrom || v.dateBounds[0]} onChange={(e) => app.setFilters({ ...app.filters, dateFrom: e.target.value })} />
                <input type="date" className={inputCls} min={v.dateBounds[0]} max={v.dateBounds[1]} value={app.filters.dateTo || v.dateBounds[1]} onChange={(e) => app.setFilters({ ...app.filters, dateTo: e.target.value })} />
              </div>
            </div>
          ) : <div className="text-xs text-slate-400">No dates in this dataset.</div>}
        </div>
      )}

      {/* Backend status */}
      <div className="mt-auto px-2 pt-6">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />Backend {app.apiStatus}
            </div>
            <button title="Backend settings" onClick={() => { setApiDraft(app.apiUrl); setShowApi(!showApi); }} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><Settings size={14} /></button>
          </div>
          <div className="mt-1 truncate font-mono text-[11px]">{app.apiUrl}</div>
          <div className="mt-0.5">Embeddings: {app.bundle?.meta.embedding_backend ?? "—"}</div>
          {showApi && (
            <div className="mt-2 space-y-2">
              <input className={inputCls} value={apiDraft} onChange={(e) => setApiDraft(e.target.value)} placeholder="http://localhost:8000" />
              <Btn variant="primary" className="w-full" onClick={() => { app.changeApiUrl(apiDraft); setShowApi(false); }}>Save &amp; reconnect</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {menu && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 shrink-0">{sidebar}</div>
          <div className="flex-1 bg-slate-900/30" onClick={() => setMenu(false)} />
        </div>
      )}
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button onClick={() => setMenu(true)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-sm"><Menu size={15} />Menu</button>
          <span className="text-sm font-semibold">Blind Spot Detector</span>
        </div>
        <div className="mx-auto max-w-[1360px] px-5 py-8 lg:px-10">
          {app.apiStatus === "offline" && (
            <ErrorBox>
              <b>Backend unreachable.</b> {app.apiError} If you are the owner, start it with <code className="rounded bg-red-100 px-1">uvicorn backend.main:app --port 8000</code> (or <code className="rounded bg-red-100 px-1">scripts/share.sh</code> to share it publicly). Otherwise the owner&apos;s machine is probably switched off — try again later.
              <div className="mt-2"><Btn onClick={app.recheck}>Retry connection</Btn></div>
            </ErrorBox>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
