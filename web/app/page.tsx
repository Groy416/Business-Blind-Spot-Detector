"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, Megaphone, Target, TrendingUp } from "lucide-react";
import type { BlindSpot, Emerging, Recommendation } from "@/lib/types";
import { Gate } from "@/components/Gate";
import { ClassBadge, Card, KpiRow, Meter, Note, PageHeader, Section, SeverityBadge, Expander } from "@/components/ui";
import { SentimentDonut, TopicBar } from "@/components/charts";
import { COLORS, SEVERITY_COLORS } from "@/lib/constants";
import { flaggedSpots, mean, pct } from "@/lib/derive";
import { useApp } from "@/lib/store";

export default function Overview() {
  const app = useApp();
  return (
    <>
      <PageHeader title="Overview" subtitle={app.company ? `${app.company.name} · what customers say vs what the company communicates` : "Business Blind Spot Detector"} />
      <Gate>
        {({ bundle, view }) => {
          const minScore = bundle.meta.scoring_config?.min_score ?? 5;
          const flagged = flaggedSpots(view.blindSpots, minScore);
          const visible = new Set(view.topics.map((t) => t.topic_id));
          const emerging = bundle.trend_emerging.filter((e) => visible.has(e.topic_id));
          const m = mean(view.customer.map((c) => c.compound));
          const posPct = pct(view.customer.filter((c) => c.label === "positive").length, view.customer.length);
          const negPct = pct(view.customer.filter((c) => c.label === "negative").length, view.customer.length);
          const top = [...view.blindSpots].sort((a, b) => b.score - a.score).slice(0, 5);
          return (
            <>
              <Headline flagged={flagged} spots={view.blindSpots} emerging={emerging} recs={view.recs} />
              <KpiRow items={[
                { label: "Conversations analysed", value: view.customer.length.toLocaleString(), sub: `of ${bundle.overview.total_conversations.toLocaleString()} total`, accent: COLORS.primary },
                { label: "Topics detected", value: view.topics.length, sub: `${bundle.meta.topic_backend.toUpperCase()} discovery`, accent: "#0EA5E9" },
                { label: "Potential blind spots", value: flagged.length, sub: `${flagged.filter((f) => f.classification === "genuine_blind_spot").length} genuine`, accent: COLORS.neg },
                { label: "Emerging issues", value: emerging.length, sub: "statistically significant growth", accent: COLORS.warn },
                { label: "Overall sentiment", value: `${m >= 0 ? "+" : ""}${m.toFixed(2)}`, sub: `${posPct.toFixed(0)}% pos · ${negPct.toFixed(0)}% neg`, accent: m > 0.05 ? COLORS.pos : m < -0.05 ? COLORS.neg : COLORS.neu },
                { label: "Avg blind spot score", value: flagged.length ? mean(flagged.map((f) => f.score)).toFixed(1) : "—", sub: "flagged blind spots, 0-100", accent: "#7C3AED" },
              ]} />

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                <div>
                  <Section title="Customer sentiment" subtitle="VADER compound score per conversation"><SentimentDonut rows={view.customer} /></Section>
                </div>
                <div>
                  <Section title="Top customer concerns" subtitle="Statements per topic · colour = average sentiment"><TopicBar topics={view.topics} /></Section>
                </div>
              </div>

              <Section title="Highest-scoring blind spots" subtitle="Ranked by Blind Spot Score = Importance × Expectation Gap × Trend ÷ 10,000">
                {top.length === 0 && <Note>No blind spots match the current filters.</Note>}
                {top.map((r) => {
                  const color = SEVERITY_COLORS[r.severity];
                  return (
                    <Card key={r.topic_id} className="mb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-base font-semibold">#{r.rank} · {r.topic_label}</h4>
                        <div className="flex items-center"><ClassBadge c={r.classification} /><SeverityBadge s={r.severity} /><b className="text-xl" style={{ color }}>{r.score.toFixed(1)}</b><span className="text-slate-400">/100</span></div>
                      </div>
                      <Meter value={r.score} color={color} />
                      <p className="mt-2 text-sm text-slate-700">
                        <b>Customer importance</b> {r.importance.toFixed(0)} · <b>Company coverage</b> {r.coverage_norm.toFixed(0)} · <b>Gap</b> {r.gap.toFixed(0)} · <b>Negative</b> {r.negative_pct.toFixed(0)}% of {r.mentions} statements · <b>Trend</b> {r.trend_status ?? "n/a"}
                      </p>
                    </Card>
                  );
                })}
              </Section>

              <Section title="Emerging issues" subtitle="Topics whose share of conversation is growing significantly AND is mostly negative">
                {emerging.length === 0 ? <Note>{bundle.meta.trend_reason || "No topic shows a statistically significant increase in negative conversation."}</Note> : emerging.map((e) => (
                  <Card key={e.topic_id} className="mb-3"><h4 className="flex items-center gap-1.5 font-semibold"><TrendingUp size={15} className="text-red-600" />{e.topic_label} <span className="font-normal text-slate-500">· {e.status}</span></h4><p className="mt-1 text-sm text-slate-700">{e.reason}</p></Card>
                ))}
              </Section>

              {bundle.meta.notes.length > 0 && (
                <div className="mt-6"><Expander title={`Data-quality notes (${bundle.meta.notes.length})`}><ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{bundle.meta.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Expander></div>
              )}
            </>
          );
        }}
      </Gate>
    </>
  );
}

const HEADLINE: Record<string, string> = {
  genuine_blind_spot: "is your biggest blind spot",
  unmet_operational_need: "is your biggest unmet customer need",
  negative_experience: "is your biggest promise-versus-reality gap",
  communication_gap: "is your biggest communication gap",
};
const PRIORITY_ORDER = (p: string) => Number(p.replace(/\D/g, "").slice(0, 1) || 9);
const firstSentence = (t: string) => { const m = t.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : t).trim(); };

/** The one-sentence story of the analysis, built only from computed values (no invented numbers). */
function Headline({ flagged, spots, emerging, recs }: { flagged: BlindSpot[]; spots: BlindSpot[]; emerging: Emerging[]; recs: Recommendation[] }) {
  const top = [...flagged].sort((a, b) => b.score - a.score)[0];
  const overPromoted = spots.filter((s) => s.classification === "misplaced_emphasis").sort((a, b) => b.coverage_norm - a.coverage_norm)[0];
  const growing = emerging[0];
  const action = [...recs].sort((a, b) => PRIORITY_ORDER(a.priority) - PRIORITY_ORDER(b.priority) || b.blind_spot_score - a.blind_spot_score)[0];
  const rising = top && ["increasing", "emerging"].includes(top.trend_status ?? "");

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500"><Target size={14} />Key finding</div>
          {top ? (
            <>
              <h2 className="mt-2 text-xl font-semibold leading-snug text-slate-900 md:text-2xl">
                <span className="text-red-700">{top.topic_label}</span> {HEADLINE[top.classification] ?? "needs the most attention"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                {top.negative_pct.toFixed(0)}% of {top.mentions} customer statements about it are negative, from {top.unique_customers} different customers,
                yet it receives only {(top.coverage_share * 100).toFixed(0)}% of the company&apos;s messaging (coverage index {top.coverage_norm.toFixed(0)}/100)
                {rising ? " — and conversation about it is growing." : "."}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href="/blind-spots" className="inline-flex items-center gap-1 font-medium text-slate-900 hover:underline">See the evidence <ArrowRight size={14} /></Link>
                <Link href="/recommendations" className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900 hover:underline">What to do about it <ArrowRight size={14} /></Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">No major blind spots for the current filters</h2>
              <p className="mt-2 text-sm text-slate-600">Customer concerns and company communication are reasonably balanced, or nothing scored above the threshold.</p>
            </>
          )}
        </div>
        {top && (
          <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center md:min-w-36">
            <div className="text-xs font-medium text-slate-500">Blind Spot Score</div>
            <div className="text-3xl font-semibold tabular-nums" style={{ color: SEVERITY_COLORS[top.severity] }}>{top.score.toFixed(1)}</div>
            <div className="mt-1"><SeverityBadge s={top.severity} /></div>
          </div>
        )}
      </div>
      <div className="grid divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/60 md:grid-cols-3 md:divide-x md:divide-y-0">
        <Finding icon={<TrendingUp size={15} />} label="Growing fastest" value={growing?.topic_label} detail={growing ? `Status: ${growing.status}` : "No topic is growing significantly"} />
        <Finding icon={<Megaphone size={15} />} label="Most over-promoted" value={overPromoted?.topic_label}
          detail={overPromoted ? `Coverage ${overPromoted.coverage_norm.toFixed(0)}/100 vs customer importance ${overPromoted.importance.toFixed(0)}/100` : "No misplaced emphasis detected"} />
        <Finding icon={<Lightbulb size={15} />} label={action ? `Top action · ${action.priority}` : "Top action"} value={action?.topic_label} detail={action ? firstSentence(action.suggested_action) : "No recommendations"} />
      </div>
    </div>
  );
}

function Finding({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value?: string; detail: string }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{icon}{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value ?? "—"}</div>
      <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{detail}</div>
    </div>
  );
}
