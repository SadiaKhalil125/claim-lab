import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson } from "@/lib/tools/http";

type OpenAlexWorks = {
  results?: Array<{
    id: string;
    display_name?: string;
    publication_year?: number;
    doi?: string | null;
  }>;
};

const MAILTO = "claim-lab@users.noreply.github";

export async function searchOpenAlex(
  query: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const params = new URLSearchParams({
    search: query,
    per_page: String(limit),
    mailto: MAILTO,
  });
  const url = `https://api.openalex.org/works?${params}`;
  const data = await fetchJson<OpenAlexWorks>(url);

  return (data.results ?? []).map((work) => {
    const openAlexId = work.id.replace("https://openalex.org/", "");
    const year = work.publication_year;
    return {
      id: openAlexId,
      title: work.display_name ?? "Untitled work",
      url: work.doi?.startsWith("https://")
        ? work.doi
        : work.doi
          ? `https://doi.org/${work.doi.replace(/^https?:\/\/doi.org\//, "")}`
          : work.id,
      source: "OpenAlex",
      meta: year ? String(year) : undefined,
    };
  });
}