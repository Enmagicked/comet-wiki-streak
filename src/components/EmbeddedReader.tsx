"use client";
import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActiveTime } from "@/hooks/useActiveTime";

type Props = {
  title: string;
  pageid?: number;
  category?: string;
  source?: "streak" | "commute";
  onComplete?: () => void;
};

function sanitize(html: string) {
  // Wikipedia HTML is mostly safe but we still strip scripts/iframes and risky attrs.
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style", "link"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
  });
}

export function EmbeddedReader({ title, pageid, category, source = "streak", onComplete }: Props) {
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollPct = useRef(0);
  const completed = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seconds = useActiveTime(!!html);
  const lastFlush = useRef(0);

  // Fetch + sanitize
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/wiki/html?title=${encodeURIComponent(title)}`);
        if (!r.ok) throw new Error(`fetch ${r.status}`);
        const raw = await r.text();
        const clean = sanitize(raw);
        if (!cancelled) setHtml(clean);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [title]);

  // Track scroll
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewBottom = window.innerHeight;
      const totalScrollable = el.scrollHeight - viewBottom;
      const scrolled = Math.max(0, viewBottom - rect.top - viewBottom);
      const pct = totalScrollable > 0 ? Math.min(100, (scrolled / totalScrollable) * 100) : 0;
      scrollPct.current = Math.max(scrollPct.current, pct);
      if (scrollPct.current > 92 && !completed.current) {
        completed.current = true;
        onComplete?.();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [html, onComplete]);

  // Rewrite internal wiki links to in-app routes after html is mounted
  useEffect(() => {
    if (!html || !containerRef.current) return;
    const el = containerRef.current;
    el.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("./") || href.startsWith("/wiki/")) {
        const t = decodeURIComponent(href.replace(/^\.?\/?(wiki\/)?/, "").split("#")[0]);
        if (t && !t.includes(":")) {
          a.setAttribute("href", `/read/${encodeURIComponent(t)}`);
          a.addEventListener("click", (ev) => {
            ev.preventDefault();
            router.push(`/read/${encodeURIComponent(t)}`);
          });
        } else {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      } else if (href.startsWith("//") || href.startsWith("http")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
  }, [html, router]);

  // Periodic flush every 15s (and on hide/unmount via beacon)
  useEffect(() => {
    if (!html) return;
    if (seconds - lastFlush.current >= 15) {
      lastFlush.current = seconds;
      flush(false);
    }
  }, [seconds, html]);

  async function flush(final: boolean) {
    const payload = {
      id: sessionId ?? undefined,
      article_title: title,
      article_pageid: pageid,
      category,
      seconds_read: seconds,
      scroll_pct: scrollPct.current,
      completed: completed.current || final,
      source,
    };
    try {
      if (final && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/sessions", blob);
        return;
      }
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.session?.id && !sessionId) setSessionId(j.session.id);
      }
    } catch {}
  }

  // Flush on unmount + on tab hide
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(true); };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, sessionId]);

  if (err) {
    return <div className="max-w-3xl mx-auto p-8 text-cloud">Couldn&apos;t load that article. <Link href="/read" className="underline">Pick another</Link>.</div>;
  }
  if (!html) {
    return <div className="max-w-3xl mx-auto p-8 text-cloud-deep">Loading…</div>;
  }

  return (
    <>
      <ReaderHud title={title} seconds={seconds} scrollPct={scrollPct.current} />
      <article ref={containerRef} className="wiki-prose max-w-3xl mx-auto px-6 pt-24 pb-32" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

function ReaderHud({ title, seconds }: { title: string; seconds: number; scrollPct: number }) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="fixed top-14 left-0 right-0 z-10 backdrop-blur-md bg-night/70 border-b border-cloud-deep/20">
      <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between text-sm">
        <span className="text-cloud-deep truncate">{title.replace(/_/g, " ")}</span>
        <span className="font-mono text-moon">{m}:{s}</span>
      </div>
    </div>
  );
}
