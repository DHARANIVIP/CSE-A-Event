"use client";

import React, { useState, useEffect, useRef } from "react";
import { Panel } from "@/components/ui/Panel";
import { Padlock } from "@/components/icons";
import { formatInIST } from "@/lib/time";

interface HintItem {
  id: number;
  position: number;
  title: string | null;
  body: string | null;
  locked: boolean;
  releaseAt: string | null;
}

export default function HintsPage() {
  const [hints, setHints] = useState<HintItem[]>([]);
  const [lastEtag, setLastEtag] = useState<string | null>(null);
  const [newHintIds, setNewHintIds] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHints = async (etag: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (etag) headers["If-None-Match"] = etag;

      const res = await fetch("/api/hints", { headers });
      if (res.status === 304) {
        return; // No new changes
      }

      if (res.ok) {
        const newEtag = res.headers.get("ETag");
        if (newEtag) setLastEtag(newEtag);

        const data = await res.json();
        setHints(data.hints);

        // Check for new hints against localStorage
        try {
          const stored = localStorage.getItem("mb_seen_hint_ids");
          const seen = stored ? new Set(JSON.parse(stored)) : new Set();
          const newlyDiscovered = new Set<number>();

          for (const h of data.hints) {
            if (!h.locked && !seen.has(h.id)) {
              newlyDiscovered.add(h.id);
              seen.add(h.id);
            }
          }

          if (newlyDiscovered.size > 0) {
            setNewHintIds(newlyDiscovered);
            localStorage.setItem("mb_seen_hint_ids", JSON.stringify(Array.from(seen)));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHints(null);

    // Poll every 20 seconds, pausing on hidden tab (Section 8.5)
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchHints(lastEtag);
      }
    }, 20000);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchHints(lastEtag);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lastEtag]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="border-b-3 border-ink pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            OFFICIAL ADVISORIES
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight">
            CASE HINTS & CLUES
          </h1>
        </div>
        <span className="font-mono text-xs text-muted">
          Auto-syncing every 20s
        </span>
      </div>

      <div className="space-y-4">
        {hints.length === 0 ? (
          <Panel className="text-center font-mono text-sm text-muted py-8">
            SYNCHRONIZING HINTS WITH ORGANIZER DESK...
          </Panel>
        ) : (
          hints.map((hint) => {
            const isNew = newHintIds.has(hint.id);
            return (
              <Panel
                key={hint.id}
                className={`transition-all ${
                  hint.locked
                    ? "bg-cream/40 border-dashed border-ink/40"
                    : "bg-paper border-ink"
                }`}
              >
                {hint.locked ? (
                  <div className="flex items-center gap-4 py-3 select-none">
                    <div className="p-3 bg-cream rounded border-2 border-ink shadow-hard-sm">
                      <Padlock size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted uppercase">
                          HINT #{hint.position}
                        </span>
                        <span className="px-2 py-0.5 bg-ink text-paper font-mono text-[10px] font-bold rounded uppercase">
                          LOCKED
                        </span>
                      </div>
                      <h2 className="font-mono text-sm font-black text-ink uppercase mt-1">
                        {hint.releaseAt
                          ? `UNLOCKS AT ${formatInIST(hint.releaseAt, { timeOnly: true })}`
                          : "UNLOCKS WHEN THE ORGANISERS RELEASE IT"}
                      </h2>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-crimson uppercase">
                          HINT #{hint.position}
                        </span>
                        {isNew && (
                          <span className="px-2 py-0.5 bg-crimson text-paper font-mono text-[10px] font-black rounded border border-ink uppercase animate-pulse">
                            NEW HINT!
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-success font-bold uppercase">
                        RELEASED ✓
                      </span>
                    </div>

                    <h2 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
                      {hint.title}
                    </h2>

                    <p className="font-mono text-sm text-ink leading-relaxed whitespace-pre-line pt-1">
                      {hint.body}
                    </p>
                  </div>
                )}
              </Panel>
            );
          })
        )}
      </div>
    </div>
  );
}
