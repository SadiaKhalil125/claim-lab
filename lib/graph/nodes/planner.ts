import { fallbackQueries } from "@/lib/graph/state";
import { isLlmConfigured } from "@/lib/llm/chatModel";
import type { ClaimLabState } from "@/lib/graph/state";
import type { PlannerQueries } from "@/lib/types/claim-lab";

export type PlannerNodeResult = {
  queries: PlannerQueries;
  usedLlm: boolean;
  llmError?: string;
};

export function runPlannerNode(state: Pick<ClaimLabState, "claim">): PlannerNodeResult {
  if (!isLlmConfigured()) {
    return {
      queries: fallbackQueries(state.claim),
      usedLlm: false,
      llmError: "LiteLLM not configured — using claim text as search queries",
    };
  }
  // Phase 3: structured LLM planner
  return {
    queries: fallbackQueries(state.claim),
    usedLlm: false,
    llmError: "Planner LLM wiring ships in Phase 3",
  };
}