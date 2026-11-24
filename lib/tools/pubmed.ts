import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson } from "@/lib/tools/http";

type ESearch = {
  esearchresult?: {
    idlist?: string[];
  };
};

type ESummary = {
  result?: Record<
    string,
    {
      uid?: string;
      title?: string;
      pubdate?: string;
      source?: string;
    }
  >;
};

function ncbiBaseParams(): URLSearchParams {
  const tool = "claim-lab";
  const email =
    process.env.NCBI_CONTACT_EMAIL?.trim() || "claim-lab@example.com";
  const params = new URLSearchParams({ tool, email });
  return params;
}

export async function searchPubMed(
  query: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const searchParams = ncbiBaseParams();
  searchParams.set("db", "pubmed");
  searchParams.set("term", query);
  searchParams.set("retmode", "json");
  searchParams.set("retmax", String(limit));

  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`;
  const searchData = await fetchJson<ESearch>(searchUrl);
  const idlist = searchData.esearchresult?.idlist ?? [];
  if (idlist.length === 0) return [];

  const summaryParams = ncbiBaseParams();
  summaryParams.set("db", "pubmed");
  summaryParams.set("id", idlist.join(","));
  summaryParams.set("retmode", "json");

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams}`;
  const summaryData = await fetchJson<ESummary>(summaryUrl);
  const result = summaryData.result ?? {};

  const items: EvidenceItem[] = [];
  for (const pmid of idlist) {
    const row = result[pmid];
    if (!row?.title) continue;
    const meta = [row.source, row.pubdate].filter(Boolean).join(" · ");
    items.push({
      id: pmid,
      title: row.title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      source: "PubMed",
      meta: meta || undefined,
    });
  }
  return items;
}