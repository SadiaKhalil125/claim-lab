"use client";

import { AGENT_LABELS } from "@/lib/ui/agent-labels";
import type { AgentId, StepStatus } from "@/lib/types/claim-lab";

export type TimelineStep = {
  agent: AgentId;
  status: StepStatus | "pending";
  summary?: string;
};

type Props = {
  steps: TimelineStep[];
  animated?: boolean;
};

const STATUS_LABEL: Record<TimelineStep["status"], string> = {
  pending: "Idle",
  start: "Running",
  done: "Done",
  error: "Failed",
  skipped: "Queued",
};

const STATUS_ICON: Record<TimelineStep["status"], string> = {
  pending: "○",
  start: "◌",
  done: "✓",
  error: "✕",
  skipped: "—",
};

const statusStyles: Record<TimelineStep["status"], string> = {
  pending: "border-slate-700/50 bg-slate-900/30 text-slate-500",
  start: "border-sky-400/50 bg-sky-950/40 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.12)]",
  done: "border-emerald-500/35 bg-emerald-950/25 text-slate-200",
  error: "border-rose-500/40 bg-rose-950/30 text-rose-100",
  skipped: "border-slate-600/40 bg-slate-900/50 text-slate-400",
};

const dotStyles: Record<TimelineStep["status"], string> = {
  pending: "bg-slate-600",
  start: "bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]",
  done: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
  error: "bg-rose-400",
  skipped: "bg-slate-500",
};

const badgeStyles: Record<TimelineStep["status"], string> = {
  pending: "bg-slate-800 text-slate-400",
  start: "bg-sky-900/80 text-sky-300",
  done: "bg-emerald-900/60 text-emerald-300",
  error: "bg-rose-900/60 text-rose-300",
  skipped: "bg-slate-800 text-slate-400",
};

export function AgentTimeline({ steps, animated = true }: Props) {
  return (
    <ol className="relative flex flex-col gap-0 font-mono text-[13px]">
      <span
        className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-sky-500/40 via-slate-700 to-transparent"
        aria-hidden
      />
      {steps.map((step, index) => {
        const isActive = step.status !== "pending";
        const changed = step.status === "done" || step.status === "error";
        return (
          <li
            key={step.agent}
            className={`relative min-w-0 pl-8 pb-3 last:pb-0 ${
              animated && isActive ? "animate-[stepIn_0.45s_ease-out_both]" : ""
            } ${changed ? "animate-[stepDonePop_0.35s_ease-out]" : ""}`}
            style={
              animated && isActive
                ? { animationDelay: `${Math.min(index * 45, 400)}ms` }
                : undefined
            }
          >
            <span
              className={`absolute left-1.5 top-4 flex h-2.5 w-2.5 items-center justify-center rounded-sm ring-2 ring-[#0c1018] ${dotStyles[step.status]}`}
              aria-hidden
            />
            <div
              className={`min-w-0 overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-300 ${statusStyles[step.status]} ${
                step.status === "start" ? "scale-[1.01]" : "scale-100"
              }`}
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-sans text-sm font-medium leading-snug text-slate-100">
                  <span
                    className={`shrink-0 font-mono text-base leading-none ${
                      step.status === "done"
                        ? "text-emerald-400"
                        : step.status === "error"
                          ? "text-rose-400"
                          : step.status === "start"
                            ? "text-sky-400"
                            : "text-slate-500"
                    }`}
                    aria-hidden
                  >
                    {STATUS_ICON[step.status]}
                  </span>
                  <span className="min-w-0 truncate">{AGENT_LABELS[step.agent]}</span>
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide ${badgeStyles[step.status]}`}
                >
                  {STATUS_LABEL[step.status]}
                </span>
              </div>
              {step.summary ? (
                <p
                  className="mt-1.5 line-clamp-3 break-words font-sans text-xs leading-relaxed text-slate-400"
                  title={step.summary}
                >
                  {step.summary}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}