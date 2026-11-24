const DEFAULT_TIMEOUT_MS = 15000;

export class HttpToolError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "HttpToolError";
  }
}

export async function fetchText(
  url: string,
  options?: { timeoutMs?: number; headers?: HeadersInit },
): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await fetch(url, {
    headers: options?.headers,
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new HttpToolError(`HTTP ${res.status} for ${url}`, res.status);
  }
  return res.text();
}

export async function fetchJson<T>(
  url: string,
  options?: { timeoutMs?: number; headers?: HeadersInit },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const res = await fetch(url, {
    headers: options?.headers,
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new HttpToolError(`HTTP ${res.status} for ${url}`, res.status);
  }
  return res.json() as Promise<T>;
}