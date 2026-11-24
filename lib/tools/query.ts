/** Shorter queries help Europe PMC and other search APIs. */
export function compactSearchQuery(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

/** Europe PMC boolean query — fewer false positives, smaller payload. */
export function europePmcAndQuery(text: string): string {
  const words = compactSearchQuery(text, 5).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "memory";
  return words.map((w) => `(${w})`).join(" AND ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}