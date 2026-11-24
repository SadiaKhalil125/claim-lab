export const AGENT_IDS = [
  "planner",
  "trialScout",
  "openAlexScout",
  "europePmcScout",
  "crossrefScout",
  "pubmedScout",
  "regulatoryScout",
  "mergeEvidence",
  "advocate",
  "critic",
  "writer",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type EvidenceItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  meta?: string;
};

export type PlannerQueries = {
  literatureQuery: string;
  trialQuery: string;
  regulatoryTerms: string[];
};

export type FinalBrief = {
  say: string[];
  dontSay: string[];
  needMoreProof: string[];
  citations: { label: string; url: string }[];
  placeholder?: boolean;
};

export type StepStatus = "start" | "done" | "error" | "skipped";

export type StreamEvent =
  | {
      type: "step";
      status: StepStatus;
      agent: AgentId;
      summary?: string;
      data?: unknown;
    }
  | { type: "complete"; brief: FinalBrief }
  | { type: "error"; message: string };

export type ScoutResult = {
  items: EvidenceItem[];
  error?: string;
};