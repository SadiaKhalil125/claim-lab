import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson } from "@/lib/tools/http";

type FdaLabelResponse = {
  results?: Array<{
    id?: string;
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
    };
    description?: string[];
  }>;
};

function buildFdaSearch(terms: string[], fallbackQuery: string): string {
  const term = terms.find((t) => t.length > 2) ?? fallbackQuery.split(/\s+/)[0];
  if (!term) return 'effective_time:["20200101" TO "20291231"]';
  const escaped = term.replace(/"/g, "");
  return `openfda.brand_name:"${escaped}"+openfda.generic_name:"${escaped}"`;
}

export async function searchOpenFda(
  regulatoryTerms: string[],
  fallbackQuery: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const search = buildFdaSearch(regulatoryTerms, fallbackQuery);
  const params = new URLSearchParams({
    search,
    limit: String(limit),
  });
  const url = `https://api.fda.gov/drug/label.json?${params}`;

  try {
    const data = await fetchJson<FdaLabelResponse>(url);
    const results = data.results ?? [];

    return results.map((row, index) => {
      const brand = row.openfda?.brand_name?.[0];
      const generic = row.openfda?.generic_name?.[0];
      const title = brand ?? generic ?? `Drug label ${index + 1}`;
      const id = row.id ?? `fda-label-${index}`;
      const snippet = row.description?.[0]?.slice(0, 120);
      return {
        id,
        title,
        url: `https://api.fda.gov/drug/label.json?search=id:"${id}"`,
        source: "openFDA",
        meta: snippet ? `${snippet}…` : generic,
      } satisfies EvidenceItem;
    });
  } catch {
    const eventParams = new URLSearchParams({
      search: `patient.drug.medicinalproduct:${encodeURIComponent(fallbackQuery.split(/\s+/).slice(0, 2).join(" "))}`,
      limit: String(limit),
    });
    const eventUrl = `https://api.fda.gov/drug/event.json?${eventParams}`;
    type FdaEvent = {
      results?: Array<{ safetyreportid?: string; patient?: { drug?: unknown } }>;
    };
    const events = await fetchJson<FdaEvent>(eventUrl);
    return (events.results ?? []).slice(0, limit).map((ev, i) => ({
      id: ev.safetyreportid ?? `event-${i}`,
      title: `FAERS report ${ev.safetyreportid ?? i + 1}`,
      url: "https://open.fda.gov/",
      source: "openFDA",
      meta: "Adverse event search (fallback)",
    }));
  }
}