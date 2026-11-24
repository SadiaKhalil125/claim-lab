"use client";

import { AGENT_LABELS } from "@/lib/ui/agent-labels";
import type { AgentId } from "@/lib/types/claim-lab";

export type QueuedError = {
  id: string;
  agent: AgentId;
  message: string;
};

type Props = {
  queue: QueuedError[];
  onSkip: () => void;
  onSkipAll: () => void;
};

export function ScoutErrorModal({ queue, onSkip, onSkipAll }: Props) {
  const current = queue[0];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scout-error-title"
    >
      <div
        className="absolute inset-0 animate-[backdropIn_0.25s_ease-out] bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={onSkip}
      />
      <div className="lab-card relative z-10 w-full max-w-md animate-[modalIn_0.35s_cubic-bezier(0.16,1,0.3,1)] rounded-xl border-rose-500/40 p-6 shadow-[0_0_40px_rgba(244,63,94,0.15)]">
        <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
          agent.alert
        </div>
        <h2
          id="scout-error-title"
          className="font-sans text-lg font-semibold text-slate-100"
        >
          {AGENT_LABELS[current.agent]}
        </h2>
        {queue.length > 1 ? (
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {queue.length - 1} more in queue
          </p>
        ) : null}
        <p className="mt-4 max-h-40 overflow-y-auto break-words font-sans text-sm leading-relaxed text-slate-300">
          {current.message}
        </p>
        <p className="mt-3 font-sans text-xs text-slate-500">
          Other agents keep running. You can skip and continue reviewing results.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg bg-sky-500 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onSkipAll}
            className="rounded-lg border border-slate-600 px-5 py-2 font-mono text-xs uppercase tracking-wider text-slate-300 transition hover:border-slate-500"
          >
            Skip all
          </button>
        </div>
      </div>
    </div>
  );
}