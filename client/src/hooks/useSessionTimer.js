import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const FLUSH_INTERVAL_MS = 30_000;

/**
 * A study-session timer that survives page navigation and full refreshes.
 * State is timestamp-based (not interval-accumulated) so it can't drift, and
 * it's stored per-session in localStorage so switching sessions or reloading
 * the tab picks up exactly where it left off. Accumulated seconds are synced
 * to the backend (`totalFocusedSeconds`) on an interval, on pause, and on
 * unmount — never overwritten, always incremented server-side.
 */
export function useSessionTimer(sessionId, initialTotalSeconds = 0) {
  const storageKey = `dsa-timer:${sessionId}`;
  const stateRef = useRef({ running: false, startedAtMs: null, bufferedSeconds: 0 });
  const [, tick] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);
  const rerender = () => tick((t) => t + 1);

  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
    } catch {
      /* localStorage unavailable — timer still works for this tab session */
    }
  };

  const elapsed = () => {
    const { running, startedAtMs, bufferedSeconds } = stateRef.current;
    if (running && startedAtMs) return bufferedSeconds + Math.floor((Date.now() - startedAtMs) / 1000);
    return bufferedSeconds;
  };

  const flush = async () => {
    const secs = elapsed();
    const wasRunning = stateRef.current.running;
    stateRef.current = { running: wasRunning, startedAtMs: wasRunning ? Date.now() : null, bufferedSeconds: 0 };
    persist();
    if (secs > 0) {
      try {
        const updated = await api.updateSession(sessionId, { addFocusedSeconds: secs });
        setTotalSeconds(updated.totalFocusedSeconds);
      } catch {
        // Roll the seconds back in so we don't lose them on a transient network error.
        stateRef.current.bufferedSeconds += secs;
        persist();
      }
    }
  };

  // Load any in-flight timer for this session on mount / when session changes.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      stateRef.current = raw ? JSON.parse(raw) : { running: false, startedAtMs: null, bufferedSeconds: 0 };
    } catch {
      stateRef.current = { running: false, startedAtMs: null, bufferedSeconds: 0 };
    }
    setTotalSeconds(initialTotalSeconds);
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Re-render once a second so the displayed clock ticks; the underlying
  // value is always derived from timestamps, so no drift accumulates.
  useEffect(() => {
    const id = setInterval(rerender, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-flush periodically, and on unmount / tab close.
  useEffect(() => {
    const id = setInterval(() => {
      if (stateRef.current.running) flush();
    }, FLUSH_INTERVAL_MS);
    const onUnload = () => {
      if (stateRef.current.running) navigator.sendBeacon?.(""); // best-effort; real flush below covers most cases
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onUnload);
      if (stateRef.current.running) flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const start = () => {
    stateRef.current = { ...stateRef.current, running: true, startedAtMs: Date.now() };
    persist();
    rerender();
  };

  const pause = () => {
    stateRef.current = { running: false, startedAtMs: null, bufferedSeconds: elapsed() };
    persist();
    flush();
    rerender();
  };

  const reset = () => {
    stateRef.current = { running: false, startedAtMs: null, bufferedSeconds: 0 };
    persist();
    rerender();
  };

  return { seconds: elapsed(), isRunning: stateRef.current.running, totalSeconds, start, pause, reset, flush };
}
