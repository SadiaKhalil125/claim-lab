import { runPlannerNode } from "@/lib/graph/nodes/planner";
import { buildPlaceholderBrief } from "@/lib/graph/nodes/llm-stubs";
import type {
  AgentId,
  EvidenceItem,
  StepStatus,
  StreamEvent,
} from "@/lib/types/claim-lab";
import { runScout } from "@/lib/tools";
import { isLlmConfigured } from "@/lib/llm/chatModel";

const SCOUT_AGENTS = [
  "trialScout",
  "openAlexScout",
  "europePmcScout",
  "crossrefScout",
  "pubmedScout",
  "regulatoryScout",
] as const;

type ScoutAgentId = (typeof SCOUT_AGENTS)[number];

type EvidenceKey =
  | "trialEvidence"
  | "openAlexEvidence"
  | "europePmcEvidence"
  | "crossrefEvidence"
  | "pubmedEvidence"
  | "regulatoryEvidence";

const SCOUT_TO_KEY: Record<ScoutAgentId, EvidenceKey> = {
  trialScout: "trialEvidence",
  openAlexScout: "openAlexEvidence",
  europePmcScout: "europePmcEvidence",
  crossrefScout: "crossrefEvidence",
  pubmedScout: "pubmedEvidence",
  regulatoryScout: "regulatoryEvidence",
};

function step(
  status: StepStatus,
  agent: AgentId,
  extra?: { summary?: string; data?: unknown },
): StreamEvent {
  return { type: "step", status, agent, ...extra };
}

function emitScoutResult(
  agent: ScoutAgentId,
  result: Awaited<ReturnType<typeof runScout>>,
): StreamEvent {
  if (result.error) {
    return step("error", agent, {
      summary: result.error,
      data: { items: [] },
    });
  }
  return step("done", agent, {
    summary: `${result.items.length} result(s)`,
    data: { items: result.items },
  });
}

/** Run scouts in parallel but emit done/error as each finishes (live timeline). */
async function* streamScoutsInParallel(
  agents: readonly ScoutAgentId[],
  queries: ReturnType<typeof runPlannerNode>["queries"],
  evidence: Record<EvidenceKey, EvidenceItem[]>,
): AsyncGenerator<StreamEvent> {
  for (const agent of agents) {
    yield step("start", agent);
  }

  type ScoutJob = { agent: ScoutAgentId; promise: ReturnType<typeof runScout> };
  const jobs: ScoutJob[] = agents.map((agent) => ({
    agent,
    promise: runScout(agent, queries),
  }));

  const pending = [...jobs];
  while (pending.length > 0) {
    const settled = await Promise.race(
      pending.map((job) =>
        job.promise.then((result) => ({ agent: job.agent, result })),
      ),
    );
    const idx = pending.findIndex((j) => j.agent === settled.agent);
    if (idx >= 0) pending.splice(idx, 1);

    const key = SCOUT_TO_KEY[settled.agent];
    evidence[key] = settled.result.items;
    yield emitScoutResult(settled.agent, settled.result);
  }
}

export async function* streamClaimLab(claim: string): AsyncGenerator<StreamEvent> {
  const trimmed = claim.trim();
  if (!trimmed) {
    yield { type: "error", message: "Claim cannot be empty" };
    return;
  }

  yield step("start", "planner");
  const planner = runPlannerNode({ claim: trimmed });
  if (planner.llmError) {
    yield step("done", "planner", {
      summary: planner.llmError,
      data: planner.queries,
    });
  } else {
    yield step("done", "planner", { data: planner.queries });
  }

  const evidence: Record<EvidenceKey, EvidenceItem[]> = {
    trialEvidence: [],
    openAlexEvidence: [],
    europePmcEvidence: [],
    crossrefEvidence: [],
    pubmedEvidence: [],
    regulatoryEvidence: [],
  };

  yield* streamScoutsInParallel(SCOUT_AGENTS, planner.queries, evidence);

  const allEvidence = Object.values(evidence).flat();

  yield step("start", "mergeEvidence");
  yield step("done", "mergeEvidence", {
    summary: `${allEvidence.length} total references`,
    data: evidence,
  });

  const llmNote = isLlmConfigured()
    ? "LLM nodes ready — Phase 3 will run advocate, critic, and writer."
    : "LiteLLM not configured — advocate / critic / writer skipped.";

  for (const agent of ["advocate", "critic", "writer"] as const) {
    yield step("start", agent);
    yield step("skipped", agent, { summary: llmNote });
  }

  const brief = buildPlaceholderBrief(trimmed, allEvidence);
  yield { type: "complete", brief };
}