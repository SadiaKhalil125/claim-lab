/**
 * LangGraph compile target for Phase 3 (LLM nodes + conditional scout retry).
 * Phase 1 uses `streamClaimLab` in stream-bridge.ts for reliable SSE.
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ClaimLabStateAnnotation, fallbackQueries } from "@/lib/graph/state";

// Scaffold graph: planner → END (Phase 3 adds scout + LLM nodes).
const graph = new StateGraph(ClaimLabStateAnnotation)
  .addNode("planner", async (state) => ({
    queries: state.queries ?? fallbackQueries(state.claim),
  }))
  .addEdge(START, "planner")
  .addEdge("planner", END);

export const claimLabGraphScaffold = graph.compile();