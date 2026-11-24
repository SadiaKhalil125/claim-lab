"use client";

import type { FinalBrief } from "@/lib/types/claim-lab";

type Props = {
  brief: FinalBrief | null;
};

function SectionCard({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/40">
      <div className={`border-b border-slate-700/40 px-4 py-2 ${accent}`}>
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
          {title}
        </h3>
      </div>
      <ul className="space-y-2 px-4 py-3 font-sans text-sm leading-relaxed text-slate-300">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-2">
            <span className="mt-2 font-mono text-sky-500/80">&gt;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function groupCitations(brief: FinalBrief) {
  const groups = new Map<string, { label: string; url: string }[]>();
  for (const c of brief.citations) {
    const source = c.label.split(":")[0] ?? "Other";
    const list = groups.get(source) ?? [];
    list.push(c);
    groups.set(source, list);
  }
  return groups;
}

export function BriefPanel({ brief }: Props) {
  if (!brief) {
    return (
      <div className="rounded-lg border border-dashed border-slate-600/60 bg-slate-900/20 px-5 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Awaiting input
        </p>
        <p className="mt-2 font-sans text-sm text-slate-400">
          Run a claim to stream scout output here.
        </p>
      </div>
    );
  }

  const groups = groupCitations(brief);

  return (
    <div className="flex flex-col gap-4">
      {brief.placeholder ? (
        <p className="rounded-lg border border-sky-500/30 bg-sky-950/30 px-4 py-3 font-mono text-xs leading-relaxed text-sky-200/90">
          // SCOUT_PREVIEW — LLM counsel modules load in Phase 3
        </p>
      ) : null}

      <SectionCard
        title="say"
        accent="bg-emerald-950/50 text-emerald-400"
        items={brief.say}
      />
      <SectionCard
        title="dont_say"
        accent="bg-rose-950/40 text-rose-400"
        items={brief.dontSay}
      />
      <SectionCard
        title="need_proof"
        accent="bg-slate-800/60 text-slate-400"
        items={brief.needMoreProof}
      />

      {brief.citations.length > 0 ? (
        <section className="rounded-lg border border-slate-700/50 bg-slate-900/40">
          <div className="border-b border-slate-700/40 bg-slate-800/40 px-4 py-2">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">
              citations [{brief.citations.length}]
            </h3>
          </div>
          <div className="max-h-80 space-y-4 overflow-y-auto px-4 py-3">
            {[...groups.entries()].map(([source, links]) => (
              <div key={source}>
                <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-violet-400">
                  {source}
                </p>
                <ul className="space-y-2">
                  {links.map((c) => (
                    <li key={c.url}>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-sm text-slate-200 underline decoration-sky-600/60 underline-offset-2 transition hover:text-sky-300"
                      >
                        {c.label.includes(":")
                          ? c.label.split(":").slice(1).join(":").trim()
                          : c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}