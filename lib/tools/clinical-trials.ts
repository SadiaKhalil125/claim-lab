import type { EvidenceItem } from "@/lib/types/claim-lab";
import { fetchJson } from "@/lib/tools/http";

type StudiesResponse = {
  studies?: Array<{
    protocolSection?: {
      identificationModule?: {
        nctId?: string;
        briefTitle?: string;
      };
      statusModule?: {
        overallStatus?: string;
      };
    };
  }>;
};

export async function searchClinicalTrials(
  query: string,
  limit = 5,
): Promise<EvidenceItem[]> {
  const params = new URLSearchParams({
    "query.term": query,
    pageSize: String(limit),
    format: "json",
  });
  const url = `https://clinicaltrials.gov/api/v2/studies?${params}`;
  const data = await fetchJson<StudiesResponse>(url);
  const studies = data.studies ?? [];

  const items: EvidenceItem[] = [];
  for (const study of studies) {
    const idMod = study.protocolSection?.identificationModule;
    const nctId = idMod?.nctId;
    const title = idMod?.briefTitle;
    if (!nctId || !title) continue;
    const status =
      study.protocolSection?.statusModule?.overallStatus ?? "Unknown";
    items.push({
      id: nctId,
      title,
      url: `https://clinicaltrials.gov/study/${nctId}`,
      source: "ClinicalTrials.gov",
      meta: status,
    });
  }
  return items;
}