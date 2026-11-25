/**
 * Readable topic names.
 *
 * The backend labels each topic with its three most distinctive keywords ("support, email, never").
 * That is precise but hard to read in a dashboard. This module turns the keyword list into a short
 * business-style name ("Customer support") using a small, transparent dictionary of common
 * customer-experience themes. It never invents information:
 *   - the name is chosen only from keywords the backend actually found,
 *   - if no theme matches clearly, the name falls back to the keywords themselves ("Item & Return"),
 *   - the original keyword label is always kept (bundle.keyword_labels) and shown next to the name.
 */
import type { Bundle, RescoreResult } from "./types";

type Theme = { name: string; words: Record<string, number> };

/** word -> weight (1 = strong signal, 0.5 = weak signal that only helps when other words agree) */
const THEMES: Theme[] = [
  { name: "Refunds", words: w("refund refunds refunded reimburse reimbursement chargeback credited", "money") },
  { name: "Returns & exchanges", words: w("return returns returned exchange exchanged replacement replace", "item items") },
  { name: "Customer support", words: w("support agent agents chatbot bot helpline ticket tickets human email emails call called callback reply replied respond response contact service", "resolved unresolved customer") },
  { name: "Delivery & shipping", words: w("delivery delivered deliver shipping shipped courier delay delayed late tracking parcel package dispatch", "arrived arrive") },
  { name: "Payments", words: w("payment payments pay paid card upi transaction transactions deducted charged wallet", "failed") },
  { name: "App performance", words: w("app crash crashes crashing load loading slow freeze freezes lag laggy bug bugs screen pages login", "phone update") },
  { name: "Pricing & discounts", words: w("price prices pricing discount discounts deal deals offer offers coupon coupons sale cashback expensive cheap save", "free") },
  { name: "Checkout experience", words: w("checkout cart", "easy smooth seamless") },
  { name: "Product quality", words: w("quality damaged broken defective fake wrong size", "product products different") },
  { name: "Feature requests", words: w("feature features wishlist option options filter filters", "add") },
  { name: "Loyalty & membership", words: w("membership members member plus points loyalty rewards bonus", "early access") },
  { name: "Product discovery", words: w("search browse catalog catalogue recommendations", "new") },
];

/** Words that say nothing about the subject; never used as a name or a distinguishing word. */
const GENERIC = new Set(("good great bad never always issue issues problem problems customer customers time times still even really get got " +
  "one also day days week weeks month months hour hours waiting waited wait forever takes take took way use used nothing no not without " +
  "went go going today experience order orders shop real twice request requests shown updates update new").split(" "));

function w(strong: string, weak = ""): Record<string, number> {
  const out: Record<string, number> = {};
  strong.split(" ").filter(Boolean).forEach((x) => (out[x] = 1));
  weak.split(" ").filter(Boolean).forEach((x) => (out[x] = 0.5));
  return out;
}

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function keywordsOf(label: string, keywords: string[] | null | undefined): string[] {
  const k = (keywords && keywords.length ? keywords : label.split(",")).map((x) => x.trim().toLowerCase()).filter(Boolean);
  return [...new Set(k)].slice(0, 8);
}

/** Best theme for a keyword list, weighting earlier (more distinctive) keywords more. */
function bestTheme(kws: string[]): { name: string; score: number } | null {
  let best: { name: string; score: number } | null = null;
  for (const t of THEMES) {
    const score = kws.reduce((acc, k, i) => acc + (t.words[k] ?? 0) / (1 + i * 0.35), 0);
    if (score > (best?.score ?? 0)) best = { name: t.name, score };
  }
  return best && best.score >= 0.7 ? best : null;
}

/** No clear theme: keep the model's own keywords (honest), just tidied: "items, weeks, different" -> "Items, weeks, different". */
function fallbackName(kws: string[]): string {
  return title(kws.slice(0, 3).join(", ")) || "Unlabelled topic";
}

/** For duplicate names: prefer a keyword that belongs to another theme ("refund"), else any specific keyword. */
function distinguisher(kws: string[], own: Theme | undefined, used: Set<string>, name: string): string | undefined {
  const ok = (k: string) => !GENERIC.has(k) && !(own?.words[k]) && !used.has(k) && !name.toLowerCase().includes(k);
  return kws.find((k) => ok(k) && THEMES.some((t) => t !== own && t.words[k] === 1)) ?? kws.find(ok);
}

/** Name a set of {id, label, keywords} items; duplicate names get a distinguishing keyword. */
export function nameTopics(items: { id: number; label: string; keywords: string[] | null | undefined }[]): Record<number, string> {
  const draft = items.map((it) => {
    const kws = keywordsOf(it.label, it.keywords);
    const theme = bestTheme(kws);
    return { id: it.id, kws, name: theme?.name ?? fallbackName(kws), score: theme?.score ?? 0, themed: !!theme };
  });
  const out: Record<number, string> = {};
  const groups = new Map<string, typeof draft>();
  draft.forEach((d) => groups.set(d.name, [...(groups.get(d.name) ?? []), d]));
  for (const [name, g] of groups) {
    if (g.length === 1) { out[g[0].id] = name; continue; }
    const theme = THEMES.find((t) => t.name === name);
    const used = new Set<string>();
    [...g].sort((a, b) => b.score - a.score).forEach((d, i) => {
      if (i === 0) { out[d.id] = name; return; }
      const extra = distinguisher(d.kws, theme, used, name);
      if (extra) used.add(extra);
      out[d.id] = extra ? `${name} (${extra})` : `${name} (${i + 1})`;
    });
  }
  return out;
}

const swapQuoted = (text: string, from: string, to: string) => (text ? text.split(`'${from}'`).join(`'${to}'`) : text);

/** Return a copy of the bundle with readable topic/theme names; originals kept in keyword_labels / theme_keyword_labels. */
export function humanizeBundle(b: Bundle): Bundle {
  const names = nameTopics(b.topics.map((t) => ({ id: t.topic_id, label: t.label, keywords: t.keywords })));
  const original: Record<number, string> = Object.fromEntries(b.topics.map((t) => [t.topic_id, t.label]));
  const themeNames = nameTopics(b.company_themes.map((t) => ({ id: t.theme_id, label: t.label, keywords: t.keywords })));
  const nm = (id: number, fallback: string) => names[id] ?? fallback;
  const recText = (s: string, id: number) => swapQuoted(s, original[id] ?? "", nm(id, original[id] ?? ""));
  return {
    ...b,
    keyword_labels: original,
    theme_keyword_labels: Object.fromEntries(b.company_themes.map((t) => [t.theme_id, t.label])),
    topics: b.topics.map((t) => ({ ...t, label: nm(t.topic_id, t.label) })),
    company_themes: b.company_themes.map((t) => ({ ...t, label: themeNames[t.theme_id] ?? t.label })),
    blind_spots: b.blind_spots.map((s) => ({ ...s, topic_label: nm(s.topic_id, s.topic_label) })),
    recommendations: b.recommendations.map((r) => ({
      ...r, topic_label: nm(r.topic_id, r.topic_label),
      problem: recText(r.problem, r.topic_id), suggested_action: recText(r.suggested_action, r.topic_id), expected_impact: recText(r.expected_impact, r.topic_id),
    })),
    expectations: b.expectations.map((e) => ({ ...e, topic_label: e.topic_label === null ? null : nm(e.topic_id, e.topic_label) })),
    trend_summary: b.trend_summary.map((s) => ({ ...s, topic_label: nm(s.topic_id, s.topic_label) })),
    trend_spikes: b.trend_spikes.map((s) => ({ ...s, topic_label: nm(s.topic_id, s.topic_label) })),
    trend_emerging: b.trend_emerging.map((s) => ({ ...s, topic_label: nm(s.topic_id, s.topic_label) })),
  };
}

/** Apply the same names to a re-scoring result (it comes straight from the backend with keyword labels). */
export function humanizeRescore(r: RescoreResult, b: Bundle | null): RescoreResult {
  if (!b?.keyword_labels) return r;
  const names: Record<number, string> = Object.fromEntries(b.topics.map((t) => [t.topic_id, t.label]));
  const orig = b.keyword_labels;
  const recText = (s: string, id: number) => swapQuoted(s, orig[id] ?? "", names[id] ?? orig[id] ?? "");
  return {
    ...r,
    blind_spots: r.blind_spots.map((s) => ({ ...s, topic_label: names[s.topic_id] ?? s.topic_label })),
    recommendations: r.recommendations.map((x) => ({
      ...x, topic_label: names[x.topic_id] ?? x.topic_label,
      problem: recText(x.problem, x.topic_id), suggested_action: recText(x.suggested_action, x.topic_id), expected_impact: recText(x.expected_impact, x.topic_id),
    })),
  };
}
