const REST = "https://en.wikipedia.org/api/rest_v1";
const ACTION = "https://en.wikipedia.org/w/api.php";
const UA = "WikiStreak/0.1 (https://github.com/wiki-streak; learning project)";

const headers = { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" };

export type WikiSummary = {
  title: string;
  pageid: number;
  description?: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls: { desktop: { page: string } };
};

export async function getSummary(title: string): Promise<WikiSummary> {
  const r = await fetch(`${REST}/page/summary/${encodeURIComponent(title)}`, {
    headers, next: { revalidate: 3600 },
  });
  if (!r.ok) throw new Error(`summary ${r.status}`);
  return r.json();
}

export async function getHtml(title: string): Promise<string> {
  const r = await fetch(`${REST}/page/html/${encodeURIComponent(title)}`, {
    headers: { ...headers, Accept: "text/html" }, next: { revalidate: 3600 },
  });
  if (!r.ok) throw new Error(`html ${r.status}`);
  return r.text();
}

export async function search(q: string, limit = 8) {
  const u = new URL(ACTION);
  u.search = new URLSearchParams({
    action: "query", list: "search", srsearch: q, srlimit: String(limit),
    format: "json", origin: "*", srprop: "snippet|size",
  }).toString();
  const r = await fetch(u, { headers, next: { revalidate: 600 } });
  if (!r.ok) throw new Error(`search ${r.status}`);
  const j = await r.json();
  return (j?.query?.search ?? []) as Array<{ title: string; pageid: number; snippet: string; size: number }>;
}

export async function random(n = 1) {
  const u = new URL(ACTION);
  u.search = new URLSearchParams({
    action: "query", generator: "random", grnnamespace: "0", grnlimit: String(n),
    prop: "info|extracts", inprop: "url", exintro: "1", explaintext: "1",
    format: "json", origin: "*",
  }).toString();
  const r = await fetch(u, { headers, cache: "no-store" });
  if (!r.ok) throw new Error(`random ${r.status}`);
  const j = await r.json();
  const pages = Object.values(j?.query?.pages ?? {}) as Array<{ title: string; pageid: number; length: number; extract?: string }>;
  return pages;
}

export async function categoryMembers(category: string, limit = 20, cmtype: "page" | "subcat" = "page") {
  const u = new URL(ACTION);
  u.search = new URLSearchParams({
    action: "query", list: "categorymembers",
    cmtitle: category.startsWith("Category:") ? category : `Category:${category}`,
    cmtype, cmlimit: String(limit), format: "json", origin: "*",
  }).toString();
  const r = await fetch(u, { headers, next: { revalidate: 1800 } });
  if (!r.ok) throw new Error(`catmembers ${r.status}`);
  const j = await r.json();
  return (j?.query?.categorymembers ?? []) as Array<{ pageid: number; title: string; ns: number }>;
}

export async function pageInfoBatch(pageids: number[]) {
  if (!pageids.length) return [];
  const u = new URL(ACTION);
  u.search = new URLSearchParams({
    action: "query", pageids: pageids.join("|"),
    prop: "info|extracts", inprop: "url", exintro: "1", explaintext: "1", exchars: "300",
    format: "json", origin: "*",
  }).toString();
  const r = await fetch(u, { headers, next: { revalidate: 600 } });
  if (!r.ok) throw new Error(`pageinfo ${r.status}`);
  const j = await r.json();
  return Object.values(j?.query?.pages ?? {}) as Array<{ title: string; pageid: number; length: number; extract?: string }>;
}

// Reading-time estimate based on article byte length.
// ~6 chars/word, 250 wpm, but Wikipedia includes markup so /1.6 factor.
export function estimateMinutes(byteLength: number): number {
  const words = byteLength / 6 / 1.6;
  return Math.max(2, Math.round(words / 250));
}
