import type { AgentId } from "@/lib/types/claim-lab";

export const AGENT_LABELS: Record<AgentId, string> = {
  planner: "Planner",
  trialScout: "Trial scout (ClinicalTrials.gov)",
  openAlexScout: "Science scout (OpenAlex)",
  europePmcScout: "Science scout (Europe PMC)",
  crossrefScout: "Literature scout (Crossref)",
  pubmedScout: "Science scout (PubMed)",
  regulatoryScout: "Regulatory scout (openFDA)",
  mergeEvidence: "Merge evidence",
  advocate: "Advocate",
  critic: "Critic",
  writer: "Writer",
};