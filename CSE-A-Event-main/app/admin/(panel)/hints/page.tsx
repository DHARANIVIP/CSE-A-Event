"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { InputBar } from "@/components/ui/InputBar";
import { formatInIST } from "@/lib/time";

interface HintItem {
  id: number;
  position: number;
  title: string;
  body: string;
  release_at: string | null;
  released: boolean;
  released_at: string | null;
}

export default function AdminHintsPage() {
  const [hints, setHints] = useState<HintItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newReleaseAt, setNewReleaseAt] = useState("");

  const fetchHints = async () => {
    try {
      const res = await fetch("/api/admin/hints");
      if (res.ok) {
        const data = await res.json();
        setHints(data.hints);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHints();
  }, []);

  const handleReleaseNow = async (id: number) => {
    try {
      await fetch("/api/admin/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RELEASE_NOW", id }),
      });
      fetchHints();
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      await fetch("/api/admin/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          title: newTitle,
          body: newBody,
          releaseAt: newReleaseAt ? new Date(newReleaseAt).toISOString() : null,
        }),
      });

      setNewTitle("");
      setNewBody("");
      setNewReleaseAt("");
      fetchHints();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-ink pb-3">
        <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
          HINT RELEASE SCHEDULER
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          Schedule hints for automatic release or trigger instant release during the event.
        </p>
      </div>

      {/* Create New Hint */}
      <Panel className="space-y-4">
        <h2 className="font-display text-xl uppercase text-crimson font-black">
          CREATE NEW HINT
        </h2>

        <form onSubmit={handleCreate} className="space-y-3">
          <InputBar
            label="HINT TITLE"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Filter Dropped Packets on Port 8080"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-black uppercase text-ink">
              HINT NARRATIVE / CLUE
            </label>
            <textarea
              rows={3}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Detailed clue instructing students where to search in the evidence..."
              className="w-full bg-cream border-4 border-ink rounded-md p-3 font-mono text-xs text-ink placeholder:text-muted/60 focus:ring-3 focus:ring-crimson focus:outline-none"
              required
            />
          </div>

          <InputBar
            label="SCHEDULED RELEASE TIME (OPTIONAL)"
            type="datetime-local"
            value={newReleaseAt}
            onChange={(e) => setNewReleaseAt(e.target.value)}
            hint="Leave empty to keep as a manual instant release."
          />

          <Button type="submit" variant="primary" size="sm">
            ADD TO HINT ROSTER
          </Button>
        </form>
      </Panel>

      {/* Current Hints List */}
      <div className="space-y-4">
        <h2 className="font-display text-xl uppercase text-crimson font-black">
          HINTS STATUS ({hints.length})
        </h2>

        {hints.map((hint) => (
          <Panel key={hint.id} className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/15 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-crimson uppercase">
                  POSITION #{hint.position}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    hint.released ? "bg-success text-paper" : "bg-gold text-ink"
                  }`}
                >
                  {hint.released ? "RELEASED ✓" : "LOCKED"}
                </span>
              </div>

              {!hint.released && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleReleaseNow(hint.id)}
                >
                  RELEASE NOW
                </Button>
              )}
            </div>

            <h3 className="font-display text-lg uppercase text-ink font-black">
              {hint.title}
            </h3>

            <p className="font-mono text-xs text-ink/80 leading-relaxed whitespace-pre-line">
              {hint.body}
            </p>

            <div className="pt-2 text-[11px] font-mono text-muted flex justify-between">
              <span>
                SCHEDULE:{" "}
                {hint.release_at
                  ? formatInIST(hint.release_at, { timeOnly: true })
                  : "MANUAL TRIGGER"}
              </span>
              {hint.released_at && (
                <span>RELEASED AT: {formatInIST(hint.released_at, { timeOnly: true })}</span>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
