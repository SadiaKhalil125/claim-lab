import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson } from "@/lib/tools/http";
import { compactSearchQuery } from "@/lib/tools/query";

type CrossrefWorks = {
  message?: {
    items?: Array<{
      DOI?: string;
      title?: string[];
      author?: Array<{ given?: string; family?: string }>;
      published?: { "date-parts"?: number[][] };
      "published-print"?: { "date-parts"?: number[][] };
    }>;
  };
};

const MAILTO = "claim-lab@users.noreply.github";

export async function searchCrossref(
  query: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const params = new URLSearchParams({
    query: compactSearchQuery(query, 10),
    rows: String(limit),
    mailto: MAILTO,
  });
  const url = `https://api.crossref.org/works?${params}`;
  const data = await fetchJson<CrossrefWorks>(url);
  const items = data.message?.items ?? [];

  const out: EvidenceItem[] = [];
  for (let index = 0; index < items.length && out.length < limit; index++) {
    const work = items[index];
    const title = work.title?.[0]?.trim();
    const doi = work.DOI;
    if (!title) continue;
    const year =
      work.published?.["date-parts"]?.[0]?.[0] ??
      work["published-print"]?.["date-parts"]?.[0]?.[0];
    const id = doi ?? `crossref-${index}`;
    const link = doi
      ? `https://doi.org/${doi}`
      : `https://search.crossref.org/?q=${encodeURIComponent(title)}`;
    out.push({
      id,
      title,
      url: link,
      source: "Crossref",
      meta: year ? String(year) : undefined,
    });
  }
  return out;
}