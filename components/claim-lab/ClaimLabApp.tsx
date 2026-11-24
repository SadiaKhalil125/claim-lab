"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentTimeline, type TimelineStep } from "@/components/claim-lab/AgentTimeline";
import { BriefPanel } from "@/components/claim-lab/BriefPanel";
import {
  ScoutErrorModal,
  type QueuedError,
} from "@/components/claim-lab/ScoutErrorModal";
import { AGENT_IDS, type AgentId, type FinalBrief, type StreamEvent } from "@/lib/types/claim-lab";

const SAMPLE_CLAIM =
  "Omega-3 supplements improve memory in older adults";

function parseSseChunk(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data:"));
    if (!line) continue;
    const json = line.replace(/^data:\s*/, "");
    try {
      events.push(JSON.parse(json) as StreamEvent);
    } catch {
      /* ignore partial parse */
    }
  }
  return { events, rest };
}

let errorIdSeq = 0;

export function ClaimLabApp() {
  const [claim, setClaim] = useState(SAMPLE_CLAIM);
  const [running, setRunning] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [brief, setBrief] = useState<FinalBrief | null>(null);
  const [stepMap, setStepMap] = useState<Record<string, TimelineStep>>({});
  const [showResults, setShowResults] = useState(false);
  const [errorQueue, setErrorQueue] = useState<QueuedError[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const steps = useMemo(() => {
    return AGENT_IDS.map(
      (agent) => stepMap[agent] ?? { agent, status: "pending" as const },
    );
  }, [stepMap]);

  const completedScouts = useMemo(
    () =>
      steps.filter(
        (s) =>
          s.agent.endsWith("Scout") &&
          (s.status === "done" || s.status === "error"),
      ).length,
    [steps],
  );

  const pushStepError = useCallback((agent: AgentId, message: string) => {
    const llmAgents = new Set(["advocate", "critic", "writer", "planner"]);
    if (llmAgents.has(agent) && message.includes("Phase")) return;

    const softInlineOnly =
      /rate.limit|rate-limited|timed out|temporarily unavailable|busy \(503\)|unavailable right now/i;
    if (softInlineOnly.test(message)) return;

    errorIdSeq += 1;
    setErrorQueue((q) => [
      ...q,
      { id: `${agent}-${errorIdSeq}`, agent, message },
    ]);
  }, []);

  const resetTimeline = useCallback(() => {
    setStepMap({});
    setBrief(null);
    setFatalError(null);
    setErrorQueue([]);
    setShowResults(false);
  }, []);

  const applyEvent = useCallback(
    (event: StreamEvent) => {
      if (event.type === "step") {
        if (event.status === "start") {
          setShowResults(true);
        }
        setStepMap((prev) => ({
          ...prev,
          [event.agent]: {
            agent: event.agent,
            status: event.status,
            summary: event.summary,
          },
        }));
        if (event.status === "error" && event.summary) {
          pushStepError(event.agent, event.summary);
        }
      } else if (event.type === "complete") {
        setBrief(event.brief);
      } else if (event.type === "error") {
        setFatalError(event.message);
        errorIdSeq += 1;
        setErrorQueue((q) => [
          ...q,
          {
            id: `fatal-${errorIdSeq}`,
            agent: "planner",
            message: event.message,
          },
        ]);
      }
    },
    [pushStepError],
  );

  const runClaim = async () => {
    resetTimeline();
    setRunning(true);
    setShowResults(true);
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseChunk(buffer);
        buffer = rest;
        for (const event of events) applyEvent(event);
      }
      if (buffer.trim()) {
        const { events } = parseSseChunk(`${buffer}\n\n`);
        for (const event of events) applyEvent(event);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFatalError(message);
      pushStepError("planner", message);
    } finally {
      setRunning(false);
    }
  };

  const skipError = () => setErrorQueue((q) => q.slice(1));
  const skipAllErrors = () => setErrorQueue([]);

  return (
    <div className="lab-shell relative min-h-screen">
      <ScoutErrorModal
        queue={errorQueue}
        onSkip={skipError}
        onSkipAll={skipAllErrors}
      />

      <div className="lab-scanline pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header
          className={`mb-10 max-w-2xl ${mounted ? "animate-fade-slide-up" : "opacity-0"}`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded border border-sky-500/30 bg-sky-950/40 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-sky-300">
              <span className="inline-block h-2 w-2 animate-pulse rounded-sm bg-sky-400" />
              ClaimLab v0.1
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              6 scouts · langgraph
            </p>
          </div>
          <h1 className="bg-gradient-to-r from-sky-200 via-white to-violet-300 bg-clip-text font-sans text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Claim Lab
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-slate-400">
            Autonomous agents query public evidence APIs and return a
            citation-backed brief.{" "}
            <span className="text-slate-500">Not medical or legal advice.</span>
          </p>
        </header>

        <div
          className={`lab-card mb-10 rounded-xl p-6 sm:p-8 ${
            mounted ? "animate-fade-slide-up" : "opacity-0"
          }`}
          style={{ animationDelay: "80ms" }}
        >
          <label
            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400"
            htmlFor="claim"
          >
            input.claim
          </label>
          <p className="mt-1 font-sans text-xs text-slate-500">
            Natural-language statement for the scout swarm.
          </p>
          <textarea
            id="claim"
            rows={3}
            className="lab-input mt-4 w-full resize-y rounded-lg px-4 py-3 font-sans text-base leading-relaxed"
            placeholder="e.g. Omega-3 supplements improve memory in older adults"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            disabled={running}
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runClaim}
              disabled={running || !claim.trim()}
              className="rounded-lg bg-sky-500 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)] transition hover:bg-sky-400 disabled:opacity-40"
            >
              {running ? "Running…" : "Execute"}
            </button>
            <button
              type="button"
              onClick={resetTimeline}
              disabled={running}
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-300 transition hover:border-slate-500"
            >
              Reset
            </button>
            <a
              href="/api/tools/health"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-sky-400/90 underline decoration-sky-600/50 underline-offset-4 hover:text-sky-300"
            >
              api/tools/health
            </a>
            {running ? (
              <span className="font-mono text-xs text-violet-400">
                scouts {completedScouts}/6
              </span>
            ) : null}
          </div>
        </div>

        {!showResults ? (
          <div
            className="lab-card animate-fade-slide-up rounded-xl border-dashed border-slate-700/60 p-10 text-center"
            style={{ animationDelay: "160ms" }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">
              Awaiting execution
            </p>
            <p className="mt-2 font-sans text-sm text-slate-400">
              Timeline and brief appear after you run a claim.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-8 lg:grid-cols-5 lg:gap-8 animate-fade-slide-up"
            style={{ animationDelay: "0ms" }}
          >
            <div className="lg:col-span-2">
              <div className="lab-card sticky top-6 rounded-xl p-5">
                <h2 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  agent.timeline
                </h2>
                <AgentTimeline steps={steps} animated />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="lab-card rounded-xl p-6 sm:p-8">
                <h2 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  output.brief
                </h2>
                <div className={brief ? "animate-brief-reveal" : undefined}>
                  <BriefPanel brief={brief} />
                </div>
                {running && !brief ? (
                  <p className="mt-4 font-mono text-xs text-sky-400/80 animate-pulse">
                    streaming agents…
                  </p>
                ) : null}
                {fatalError && errorQueue.length === 0 ? (
                  <p className="mt-4 font-mono text-xs text-rose-400">
                    {fatalError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}