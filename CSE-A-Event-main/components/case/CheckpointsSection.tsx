"use client";

import React, { useState } from "react";
import { eventConfig } from "@/config/event.config";
import { Button } from "../ui/Button";

export const CheckpointsSection: React.FC = () => {
  const [clearedStages, setClearedStages] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const handleVerify = async (stageId: string) => {
    const val = inputs[stageId]?.trim();
    if (!val) return;

    setLoadingStage(stageId);
    setFeedback((prev) => ({ ...prev, [stageId]: "" }));

    try {
      const res = await fetch("/api/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, answer: val }),
      });
      const data = await res.json();

      if (data.correct) {
        setClearedStages((prev) => ({ ...prev, [stageId]: true }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [stageId]: "Incorrect stage answer. Check your query parameters.",
        }));
      }
    } catch {
      setFeedback((prev) => ({ ...prev, [stageId]: "Verification error." }));
    } finally {
      setLoadingStage(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-ink/20 pb-2">
        <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight">
          INTERMEDIATE STAGE CHECKPOINTS
        </h2>
        <p className="font-mono text-xs text-muted mt-1">
          Verify your intermediate conclusions before assembling the final 5-character key. Checkpoints serve as tie-breakers.
        </p>
      </div>

      <div className="space-y-3">
        {eventConfig.checkpoints.map((stage) => {
          const isCleared = clearedStages[stage.id];
          return (
            <div
              key={stage.id}
              className={`p-3 sm:p-4 rounded border-2 border-ink transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isCleared ? "bg-success/10 border-success" : "bg-cream/40"
              }`}
            >
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-black text-ink uppercase">
                  {stage.title}
                </span>
                <p className="font-mono text-xs text-muted">{stage.description}</p>
              </div>

              {isCleared ? (
                <div className="px-3 py-1 bg-success text-paper font-mono text-xs font-black rounded border border-ink shadow-sm uppercase tracking-wider self-start md:self-auto animate-pulse">
                  STAGE {stage.stage} CLEARED ✓
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter stage answer"
                    value={inputs[stage.id] || ""}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [stage.id]: e.target.value }))
                    }
                    className="px-3 py-1.5 bg-paper border-2 border-ink rounded font-mono text-xs uppercase"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={loadingStage === stage.id}
                    onClick={() => handleVerify(stage.id)}
                  >
                    CHECK
                  </Button>
                </div>
              )}

              {feedback[stage.id] && !isCleared && (
                <span className="font-mono text-xs text-danger font-bold">
                  {feedback[stage.id]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
