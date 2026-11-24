import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson, HttpToolError } from "@/lib/tools/http";
import {
  compactSearchQuery,
  europePmcAndQuery,
  sleep,
} from "@/lib/tools/query";

type EuropePmcSearch = {
  resultList?: {
    result?: Array<{
      id?: string;
      pmid?: string;
      pmcid?: string;
      doi?: string;
      title?: string;
      journalTitle?: string;
    }>;
  };
};

async function fetchEuropePmcPage(
  query: string,
  limit: number,
): Promise<EuropePmcSearch> {
  const params = new URLSearchParams({
    query,
    format: "json",
    pageSize: String(limit),
    resultType: "core",
  });
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`;
  return fetchJson<EuropePmcSearch>(url, { timeoutMs: 22000 });
}

function mapEuropePmcRows(
  data: EuropePmcSearch,
  limit: number,
): EvidenceItem[] {
  const rows = data.resultList?.result ?? [];

  return rows
    .map((row) => {
      const title = row.title?.replace(/<[^>]+>/g, "") ?? "Untitled";
      const pmid = row.pmid;
      const pmcid = row.pmcid;
      const id = pmid ?? pmcid ?? row.id ?? title.slice(0, 24);
      let url = `https://europepmc.org/search?query=${encodeURIComponent(title)}`;
      if (pmid) url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      else if (pmcid)
        url = `https://europepmc.org/article/PMC/${pmcid.replace(/^PMC/i, "")}`;
      else if (row.doi) url = `https://doi.org/${row.doi}`;

      return {
        id: String(id),
        title,
        url,
        source: "Europe PMC",
        meta: row.journalTitle,
      } satisfies EvidenceItem;
    })
    .slice(0, limit);
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HttpToolError) {
    return (
      err.status === 503 ||
      err.status === 429 ||
      err.status === 502 ||
      err.status === 504
    );
  }
  if (err instanceof Error) {
    return (
      err.name === "TimeoutError" ||
      err.message.includes("aborted") ||
      err.message.includes("timeout")
    );
  }
  return false;
}

export async function searchEuropePmc(
  query: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const attempts = [
    europePmcAndQuery(query),
    compactSearchQuery(query, 5),
    compactSearchQuery(query, 3),
  ];

  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    try {
      if (i > 0) await sleep(1200 * i);
      const data = await fetchEuropePmcPage(attempts[i], limit);
      return mapEuropePmcRows(data, limit);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("Europe PMC unavailable");
}