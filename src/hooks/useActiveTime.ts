"use client";
import { useEffect, useRef, useState } from "react";

const IDLE_MS = 30_000;

export function useActiveTime(enabled = true) {
  const [seconds, setSeconds] = useState(0);
  const lastActivity = useRef<number>(Date.now());
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const bump = () => { lastActivity.current = Date.now(); };
    const events = ["scroll", "mousemove", "keydown", "touchstart", "click"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVis);

    tick.current = setInterval(() => {
      const idle = Date.now() - lastActivity.current > IDLE_MS;
      const hidden = document.visibilityState !== "visible";
      if (!idle && !hidden) setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVis);
      if (tick.current) clearInterval(tick.current);
    };
  }, [enabled]);

  return seconds;
}
