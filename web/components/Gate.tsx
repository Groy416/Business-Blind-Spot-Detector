"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import type { Bundle } from "@/lib/types";
import type { View } from "@/lib/derive";
import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { ErrorBox, Note, Spinner } from "./ui";

/** Handles loading / empty / error states, the synthetic-data banner, and "filters excluded everything". */
export function Gate({ children, needsRecords = true }: { children: (ctx: { bundle: Bundle; view: View }) => ReactNode; needsRecords?: boolean }) {
  const app = useApp();
  if (!app.ready) return <Spinner label="Connecting to the backend…" />;
  if (app.apiStatus === "offline") return null; // the shell already shows the connection error
  if (!app.company) {
    return <Note><span className="inline-flex items-center gap-1.5"><ArrowLeft size={14} />Create a company in the sidebar to get started.</span></Note>;
  }
  if (app.bundleLoading) return <Spinner label="Loading analysis…" />;
  if (app.bundleError) return <ErrorBox>{app.bundleError}</ErrorBox>;
  if (!app.bundle || !app.view) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
        <h3 className="text-base font-semibold text-slate-900">No analysis for “{app.company.name}” yet</h3>
        <p className="mt-1 text-sm text-slate-600">Load the NovaCart demo data (or upload your own customer + company datasets) and press <b>Run analysis</b>.</p>
        <Link href="/data" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Open Data Management <ArrowRight size={15} /></Link>
      </div>
    );
  }
  return (
    <>
      {app.bundle.session.is_synthetic && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle size={15} className="shrink-0 text-amber-600" />
          <span><span className="font-medium">Demo dataset.</span> Every record in this analysis is synthetic and was generated for demonstration — it is not real customer feedback.</span>
        </div>
      )}
      {needsRecords && app.view.customer.length === 0 ? (
        <Note warn>The current filters exclude every record. Clear some filters in the sidebar.</Note>
      ) : children({ bundle: app.bundle, view: app.view })}
    </>
  );
}
