// Server-only helper for the Evolution API (WhatsApp).
// Must NOT be imported from client code.

type Method = "GET" | "POST" | "PUT" | "DELETE";

export type EvolutionRequestOptions = {
  method?: Method;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Optional per-instance token (overrides global apikey). */
  instanceToken?: string;
};

function getCreds() {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  if (!url) throw new Error("EVOLUTION_API_URL is not configured");
  if (!key) throw new Error("EVOLUTION_API_KEY is not configured");
  return { url: url.replace(/\/+$/, ""), key };
}

function buildUrl(base: string, path: string, query?: EvolutionRequestOptions["query"]) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const u = new URL(base + p);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

export async function evolutionFetch<T = unknown>(opts: EvolutionRequestOptions): Promise<T> {
  const { url, key } = getCreds();
  const target = buildUrl(url, opts.path, opts.query);

  const res = await fetch(target, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: opts.instanceToken ?? key,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "message" in data
        ? JSON.stringify((data as Record<string, unknown>).message)
        : typeof data === "string"
          ? data
          : `HTTP ${res.status}`;
    throw new Error(`Evolution API ${opts.method ?? "GET"} ${opts.path} failed [${res.status}]: ${msg}`);
  }

  return data as T;
}

/** Normalize a phone-like string to digits-only (Evolution accepts DDI+DDD+number). */
export function normalizePhone(input: string): string {
  return input.replace(/\D+/g, "");
}
