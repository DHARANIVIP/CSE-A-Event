"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

export interface QuestionItem {
  id: string;
  step: number;
  title: string;
  fileHint: string;
  text: string;
  derivation: string;
}

interface QuestionListProps {
  questions: QuestionItem[];
}

export const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  const [clearedQuestions, setClearedQuestions] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const handleCheckAnswer = async (qId: string) => {
    const val = answers[qId]?.trim();
    if (!val) return;

    setLoadingQuestion(qId);
    setFeedback((prev) => ({ ...prev, [qId]: "" }));

    try {
      const res = await fetch("/api/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: qId, answer: val }),
      });
      const data = await res.json();

      if (data.correct) {
        setClearedQuestions((prev) => ({ ...prev, [qId]: true }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [qId]: "Incorrect answer. Re-examine the evidence log file.",
        }));
      }
    } catch {
      setFeedback((prev) => ({ ...prev, [qId]: "Connection or verification error." }));
    } finally {
      setLoadingQuestion(null);
    }
  };

  return (
    <div className="space-y-5">
      {questions.map((q) => {
        const isCleared = clearedQuestions[q.id];
        return (
          <div
            key={q.id}
            className={`p-4 sm:p-5 border-2 rounded shadow-hard-sm space-y-3 transition-colors ${
              isCleared
                ? "bg-success/10 border-success"
                : "bg-cream/60 border-ink hover:border-crimson"
            }`}
          >
            {/* Question Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink shadow-sm">
                  {q.step}
                </span>
                <h3 className="font-display text-base sm:text-lg uppercase text-crimson font-black tracking-tight">
                  {q.title}
                </h3>
              </div>

              {q.fileHint && (
                <span className="font-mono text-xs px-2 py-0.5 bg-paper border border-ink rounded text-ink font-bold shadow-sm">
                  EVIDENCE FILE: {q.fileHint}
                </span>
              )}
            </div>

            {/* Question Text */}
            <p className="font-mono text-xs sm:text-sm text-ink leading-relaxed pt-1">
              {q.text}
            </p>

            {/* Clue Derivation Rule */}
            <div className="text-xs font-mono text-crimson-dark">
              <span className="font-bold uppercase tracking-wider">Clue Derivation:</span>{" "}
              {q.derivation}
            </div>

            {/* Inline Answer Checker Bar (Bottom of Each Question) */}
            <div className="pt-2 border-t border-ink/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {isCleared ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success text-paper font-mono text-xs font-black rounded border border-ink shadow-sm uppercase tracking-wider">
                  <span>✓ ANSWER VERIFIED (CHARACTER UNLOCKED)</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Enter derived answer..."
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCheckAnswer(q.id);
                      }
                    }}
                    className="px-3 py-1.5 bg-paper border-2 border-ink rounded font-mono text-xs uppercase w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brass"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={loadingQuestion === q.id}
                    onClick={() => handleCheckAnswer(q.id)}
                  >
                    CHECK ANSWER
                  </Button>
                </div>
              )}

              {feedback[q.id] && !isCleared && (
                <span className="font-mono text-xs text-danger font-bold">
                  {feedback[q.id]}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
