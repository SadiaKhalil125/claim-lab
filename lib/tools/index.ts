import type { PlannerQueries } from "@/lib/types/claim-lab";
import { searchCrossref } from "@/lib/tools/crossref";
import { searchClinicalTrials } from "@/lib/tools/clinical-trials";
import { searchEuropePmc } from "@/lib/tools/europe-pmc";
import { searchOpenAlex } from "@/lib/tools/openalex";
import { searchOpenFda } from "@/lib/tools/openfda";
import { searchPubMed } from "@/lib/tools/pubmed";
import type { ScoutResult } from "@/lib/types/claim-lab";
import { HttpToolError } from "@/lib/tools/http";

const SCOUT_NAMES: Record<string, string> = {
  trialScout: "ClinicalTrials.gov",
  openAlexScout: "OpenAlex",
  europePmcScout: "Europe PMC",
  crossrefScout: "Crossref",
  pubmedScout: "PubMed",
  regulatoryScout: "openFDA",
};

function friendlyScoutError(agent: string, err: unknown): string {
  const name = SCOUT_NAMES[agent] ?? agent;
  if (err instanceof HttpToolError) {
    if (err.status === 503)
      return `${name} is busy (503). Other scouts still ran.`;
    if (err.status === 429)
      return `${name} rate-limited (try again in ~30s or rerun without popups).`;
    return `${name} HTTP ${err.status}.`;
  }
  if (err instanceof Error) {
    if (
      err.name === "TimeoutError" ||
      err.message.includes("aborted") ||
      err.message.includes("timeout")
    ) {
      return `${name} timed out — shorter claim often helps.`;
    }
    if (err.message.includes("HTTP ")) {
      return `${name} unavailable right now.`;
    }
    return err.message.length > 120
      ? `${name} error — see API health.`
      : err.message;
  }
  return `${name} unavailable.`;
}

export type ToolHealthResult = {
  name: string;
  ok: boolean;
  count?: number;
  error?: string;
  ms: number;
};

const SAMPLE_QUERY = "omega-3 memory";

export async function runAllToolsHealthCheck(): Promise<ToolHealthResult[]> {
  const checks: Array<{
    name: string;
    run: () => Promise<unknown[]>;
  }> = [
    { name: "ClinicalTrials.gov", run: () => searchClinicalTrials(SAMPLE_QUERY, 2) },
    { name: "OpenAlex", run: () => searchOpenAlex(SAMPLE_QUERY, 2) },
    { name: "Europe PMC", run: () => searchEuropePmc(SAMPLE_QUERY, 2) },
    { name: "Crossref", run: () => searchCrossref(SAMPLE_QUERY, 2) },
    { name: "PubMed", run: () => searchPubMed(SAMPLE_QUERY, 2) },
    {
      name: "openFDA",
      run: () => searchOpenFda(["aspirin"], SAMPLE_QUERY, 2),
    },
  ];

  const results: ToolHealthResult[] = [];
  for (const check of checks) {
    const start = Date.now();
    try {
      const items = await check.run();
      results.push({
        name: check.name,
        ok: true,
        count: items.length,
        ms: Date.now() - start,
      });
    } catch (err) {
      results.push({
        name: check.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        ms: Date.now() - start,
      });
    }
  }
  return results;
}

export async function runScout(
  agent:
    | "trialScout"
    | "openAlexScout"
    | "europePmcScout"
    | "crossrefScout"
    | "pubmedScout"
    | "regulatoryScout",
  queries: PlannerQueries,
): Promise<ScoutResult> {
  try {
    let items;
    switch (agent) {
      case "trialScout":
        items = await searchClinicalTrials(queries.trialQuery, 5);
        break;
      case "openAlexScout":
        items = await searchOpenAlex(queries.literatureQuery, 5);
        break;
      case "europePmcScout":
        items = await searchEuropePmc(queries.literatureQuery, 5);
        break;
      case "crossrefScout":
        items = await searchCrossref(queries.literatureQuery, 5);
        break;
      case "pubmedScout":
        items = await searchPubMed(queries.literatureQuery, 5);
        break;
      case "regulatoryScout":
        items = await searchOpenFda(
          queries.regulatoryTerms,
          queries.literatureQuery,
          5,
        );
        break;
    }
    return { items };
  } catch (err) {
    return {
      items: [],
      error: friendlyScoutError(agent, err),
    };
  }
}