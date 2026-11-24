import type { EvidenceItem, FinalBrief } from "@/lib/types/claim-lab";
import { isLlmConfigured } from "@/lib/llm/chatModel";

export function buildPlaceholderBrief(
  claim: string,
  allEvidence: EvidenceItem[],
): FinalBrief {
  const citations = allEvidence.slice(0, 12).map((item) => ({
    label: `${item.source}: ${item.title.slice(0, 80)}`,
    url: item.url,
  }));

  return {
    say: allEvidence.length
      ? [
          `Found ${allEvidence.length} indexed references related to your claim (scout pass only).`,
        ]
      : ["No scout results yet — try a broader claim or check API health."],
    dontSay: [
      "Do not treat scout hits as proof of efficacy until Phase 3 advocate/critic runs.",
      "Do not use “clinically proven” language without reading the linked studies.",
    ],
    needMoreProof: [
      isLlmConfigured()
        ? "Advocate, critic, and writer agents ship in Phase 3 — your LiteLLM key is ready."
        : "Add LiteLLM env vars (Phase 2), then run full advocate / critic / writer in Phase 3.",
      `Original claim: “${claim.slice(0, 200)}”`,
    ],
    citations,
    placeholder: !isLlmConfigured(),
  };
}