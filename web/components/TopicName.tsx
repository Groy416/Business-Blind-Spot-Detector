"use client";

import { useApp } from "@/lib/store";

/** A readable topic name with the backend's original keywords underneath (so nothing is hidden). */
export function TopicName({ id, name, theme = false, className = "" }: { id: number; name: string; theme?: boolean; className?: string }) {
  const { bundle } = useApp();
  const kw = (theme ? bundle?.theme_keyword_labels : bundle?.keyword_labels)?.[id];
  return (
    <span className={`inline-block ${className}`}>
      <span className="font-medium text-slate-900">{name}</span>
      {kw && kw.toLowerCase() !== name.toLowerCase() && <span className="block text-xs font-normal text-slate-400" title="Keywords the model found for this topic">{kw}</span>}
    </span>
  );
}
