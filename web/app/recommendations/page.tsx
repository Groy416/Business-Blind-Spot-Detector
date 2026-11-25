"use client";

import { TopicName } from "@/components/TopicName";
import { Cog, Download, Headphones, Megaphone, Wrench, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Gate } from "@/components/Gate";
import { Badge, Btn, Card, ClassBadge, Expander, KpiRow, Note, PageHeader, PriorityBadge, Quote, SeverityBadge, Empty } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { downloadCsv } from "@/lib/derive";
import type { Recommendation } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = { Product: Wrench, "Customer Support": Headphones, Operational: Cog, Communication: Megaphone };
const CatIcon = ({ c, size = 14 }: { c: string; size?: number }) => { const I = ICONS[c]; return I ? <I size={size} className="shrink-0" /> : null; };

export default function Recommendations() {
  return (
    <>
      <PageHeader title="Recommendations" subtitle="Actions grounded in the analysed data — every item cites its evidence and score" />
      <Gate needsRecords={false}>{({ bundle, view }) => <Content recs={view.recs} llm={bundle.meta.llm_used} />}</Gate>
    </>
  );
}

function Content({ recs, llm }: { recs: Recommendation[]; llm: boolean }) {
  const [cats, setCats] = useState<string[]>([...CATEGORIES]);
  const priorities = useMemo(() => [...new Set(recs.map((r) => r.priority))].sort(), [recs]);
  const [pri, setPri] = useState<string[] | null>(null);
  const activePri = pri ?? priorities;
  if (!recs.length) return <Empty>No recommendations for the current filters (nothing scored high enough, or all topics are aligned).</Empty>;
  const view = recs.filter((r) => cats.includes(r.category) && activePri.includes(r.priority)).sort((a, b) => a.priority.localeCompare(b.priority) || b.blind_spot_score - a.blind_spot_score);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <>
      <Note>{llm ? "Wording of some recommendations was polished by the configured LLM. Scores, priorities and evidence are computed deterministically." : "Recommendations are generated deterministically from measured values (no LLM). Set LLM_PROVIDER=gemini and GEMINI_API_KEY on the backend to enable optional natural-language polishing."}</Note>
      <div className="my-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-semibold">Category</span>{CATEGORIES.map((c) => <button key={c} onClick={() => setCats(toggle(cats, c))} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${cats.includes(c) ? "border-slate-300 bg-white text-slate-900 shadow-sm" : "border-slate-200 bg-slate-50 text-slate-400"}`}><span className="inline-flex items-center gap-1.5"><CatIcon c={c} />{c}</span></button>)}</div>
        <div className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-semibold">Priority</span>{priorities.map((p) => <button key={p} onClick={() => setPri(toggle(activePri, p))} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${activePri.includes(p) ? "border-slate-300 bg-white text-slate-900 shadow-sm" : "border-slate-200 bg-slate-50 text-slate-400"}`}>{p}</button>)}</div>
        <Btn onClick={() => downloadCsv("recommendations.csv", view.map((r) => ({ priority: r.priority, category: r.category, topic: r.topic_label, score: r.blind_spot_score, severity: r.severity, problem: r.problem, action: r.suggested_action, impact: r.expected_impact })))}><Download size={15} />Export CSV</Btn>
      </div>
      <KpiRow items={[{ label: "Recommendations", value: view.length, sub: "after filters" }, ...CATEGORIES.map((c) => ({ label: c, value: view.filter((r) => r.category === c).length, sub: "recommendations" }))]} />
      {CATEGORIES.map((cat) => {
        const g = view.filter((r) => r.category === cat);
        if (!g.length) return null;
        return (
          <div key={cat} className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900"><span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600"><CatIcon c={cat} size={15} /></span>{cat} recommendations</h3>
            {g.map((r, i) => (
              <div key={i}>
                <Card className="mb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h4><TopicName id={r.topic_id} name={r.topic_label} /></h4><div className="flex flex-wrap items-center gap-y-1"><PriorityBadge p={r.priority} /><SeverityBadge s={r.severity} />{r.classification && <ClassBadge c={r.classification} />}<b className="whitespace-nowrap text-sm">Score {r.blind_spot_score.toFixed(1)}</b></div></div>
                  <p className="mt-2 text-sm text-slate-700"><b>Identified problem.</b> {r.problem}</p>
                  <p className="mt-1.5 text-sm text-slate-700"><b>Suggested action.</b> {r.suggested_action}</p>
                  <p className="mt-1.5 text-sm text-slate-700"><b>Expected business impact.</b> {r.expected_impact}</p>
                  {r.llm_enhanced && <Badge soft>LLM-polished wording</Badge>}
                </Card>
                {(r.evidence ?? []).length > 0 && <div className="mb-3"><Expander title={`Supporting customer evidence (${r.evidence!.length} quotes)`}>{r.evidence!.map((e, j) => <Quote key={j} text={e.text} meta={e.date ?? ""} />)}</Expander></div>}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
