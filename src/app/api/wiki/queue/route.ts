import { NextResponse } from "next/server";
import { categoryMembers, random, pageInfoBatch, estimateMinutes, search } from "@/lib/wiki";

type QueueItem = { title: string; pageid: number; est_minutes: number; extract?: string };

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const minutes = Math.max(2, Math.min(120, parseInt(sp.get("minutes") ?? "20", 10)));
  const mode = sp.get("mode") ?? "random"; // 'random' | 'category' | 'custom'
  const category = sp.get("category") ?? "";

  let pool: Array<{ title: string; pageid: number; length: number; extract?: string }> = [];

  if (mode === "category" && category) {
    const members = await categoryMembers(category, 50, "page");
    const ids = members.slice(0, 30).map((m) => m.pageid);
    pool = await pageInfoBatch(ids);
  } else if (mode === "custom" && category) {
    const hits = await search(category, 15);
    pool = await pageInfoBatch(hits.map((h) => h.pageid));
  } else {
    // pull a larger random pool so we can size-fit
    pool = await random(20);
  }

  // shuffle pool
  pool.sort(() => Math.random() - 0.5);

  // greedy fill until we're within ±2 of target
  const queue: QueueItem[] = [];
  let total = 0;
  for (const p of pool) {
    if (!p.length) continue;
    const m = estimateMinutes(p.length);
    if (total + m > minutes + 2) continue;
    queue.push({ title: p.title, pageid: p.pageid, est_minutes: m, extract: p.extract });
    total += m;
    if (total >= minutes - 2) break;
  }

  // if we couldn't reach minutes-2, append remaining shortest until we cross the floor
  if (total < minutes - 2) {
    for (const p of pool) {
      if (queue.find((q) => q.pageid === p.pageid)) continue;
      const m = estimateMinutes(p.length || 8000);
      queue.push({ title: p.title, pageid: p.pageid, est_minutes: m, extract: p.extract });
      total += m;
      if (total >= minutes - 2) break;
    }
  }

  return NextResponse.json({ queue, total_minutes: total, target_minutes: minutes });
}
