import type { EvidenceItem, FinalBrief, PlannerQueries } from "@/lib/types/claim-lab";
import { Annotation } from "@langchain/langgraph";

export type ClaimLabState = {
  claim: string;
  queries: PlannerQueries;
  trialEvidence: EvidenceItem[];
  openAlexEvidence: EvidenceItem[];
  europePmcEvidence: EvidenceItem[];
  crossrefEvidence: EvidenceItem[];
  pubmedEvidence: EvidenceItem[];
  regulatoryEvidence: EvidenceItem[];
  advocateText: string;
  criticText: string;
  brief: FinalBrief | null;
  scoutRetryDone: boolean;
};

export const ClaimLabStateAnnotation = Annotation.Root({
  claim: Annotation<string>,
  queries: Annotation<PlannerQueries>,
  trialEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  openAlexEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  europePmcEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  crossrefEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  pubmedEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  regulatoryEvidence: Annotation<EvidenceItem[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  advocateText: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => "",
  }),
  criticText: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => "",
  }),
  brief: Annotation<FinalBrief | null>({
    reducer: (left, right) => right ?? left,
    default: () => null,
  }),
  scoutRetryDone: Annotation<boolean>({
    reducer: (left, right) => right ?? left,
    default: () => false,
  }),
});

export function fallbackQueries(claim: string): PlannerQueries {
  const trimmed = claim.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const regulatoryTerms = words.slice(0, 3);
  return {
    literatureQuery: trimmed,
    trialQuery: trimmed,
    regulatoryTerms: regulatoryTerms.length ? regulatoryTerms : [trimmed],
  };
}