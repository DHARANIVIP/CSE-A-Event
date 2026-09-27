"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  teamId?: string;
  teamName?: string;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  teamId = "TEAM",
  teamName = "Investigator",
}) => {
  // Map of question ID to whether it was solved correctly (STRICTLY per team)
  const [clearedQuestions, setClearedQuestions] = useState<Record<string, boolean>>({});
  // Map of question ID to the unlocked first character (STRICTLY per team)
  const [unlockedChars, setUnlockedChars] = useState<Record<string, string>>({});
  // Input values
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Loading state per question
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  // Status: "idle" | "correct" | "wrong"
  const [questionStatus, setQuestionStatus] = useState<Record<string, "idle" | "correct" | "wrong">>({});
  // Feedback message
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  // Reset confirmation / status message
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Storage keys strictly scoped to THIS team to guarantee zero data leakage between teams
  const storagePrefix = `detectrix_team_${teamId}_`;
  const clearedKey = `${storagePrefix}cleared`;
  const charsKey = `${storagePrefix}chars`;
  const answersKey = `${storagePrefix}answers`;

  // Fetch verified progress from server for THIS team on mount / teamId change
  const loadTeamProgress = useCallback(async () => {
    // 1. Purge legacy un-namespaced keys to prevent cross-team bleed
    try {
      sessionStorage.removeItem("detectrix_cleared_questions");
      sessionStorage.removeItem("detectrix_unlocked_chars");
      sessionStorage.removeItem("detectrix_question_answers");
    } catch {}

    try {
      const res = await fetch("/api/checkpoint");
      if (res.ok) {
        const data = await res.json();
        // Server returns ONLY this team's cleared questions and unlocked characters
        const serverCleared = data.clearedQuestions || {};
        const serverChars = data.unlockedChars || {};
        const serverAnswers = data.answers || {};

        setClearedQuestions(serverCleared);
        setUnlockedChars(serverChars);
        setAnswers(serverAnswers);

        // Update team-scoped storage cache
        try {
          sessionStorage.setItem(clearedKey, JSON.stringify(serverCleared));
          sessionStorage.setItem(charsKey, JSON.stringify(serverChars));
          sessionStorage.setItem(answersKey, JSON.stringify(serverAnswers));
        } catch {}
      } else {
        // Fallback to team-scoped storage
        const cachedCleared = sessionStorage.getItem(clearedKey);
        const cachedChars = sessionStorage.getItem(charsKey);
        const cachedAnswers = sessionStorage.getItem(answersKey);
        if (cachedCleared) setClearedQuestions(JSON.parse(cachedCleared));
        if (cachedChars) setUnlockedChars(JSON.parse(cachedChars));
        if (cachedAnswers) setAnswers(JSON.parse(cachedAnswers));
      }
    } catch {
      // Offline fallback
    } finally {
      setInitialLoading(false);
    }
  }, [clearedKey, charsKey, answersKey]);

  useEffect(() => {
    loadTeamProgress();
  }, [loadTeamProgress]);

  // Handle checking an answer
  const handleCheckAnswer = async (qId: string) => {
    const val = answers[qId]?.trim();
    if (!val) return;

    setLoadingQuestion(qId);
    setFeedback((prev) => ({ ...prev, [qId]: "" }));
    setResetMsg(null);

    try {
      const res = await fetch("/api/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: qId, answer: val }),
      });
      const data = await res.json();

      if (data.correct) {
        const char = data.unlockedChar || val.charAt(0).toUpperCase();

        setClearedQuestions((prev) => {
          const next = { ...prev, [qId]: true };
          try {
            sessionStorage.setItem(clearedKey, JSON.stringify(next));
          } catch {}
          return next;
        });

        setUnlockedChars((prev) => {
          const next = { ...prev, [qId]: char };
          try {
            sessionStorage.setItem(charsKey, JSON.stringify(next));
          } catch {}
          return next;
        });

        setQuestionStatus((prev) => ({ ...prev, [qId]: "correct" }));
        setFeedback((prev) => ({
          ...prev,
          [qId]: `✓ CORRECT ANSWER! Character unlocked: "${char}"`,
        }));

        // Notify leaderboard sidebar and triggers to update immediately
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("leaderboard-update"));
        }
      } else {
        setQuestionStatus((prev) => ({ ...prev, [qId]: "wrong" }));
        setFeedback((prev) => ({
          ...prev,
          [qId]: "✗ WRONG ANSWER. Re-examine the evidence log file.",
        }));
      }
    } catch {
      setQuestionStatus((prev) => ({ ...prev, [qId]: "wrong" }));
      setFeedback((prev) => ({ ...prev, [qId]: "✗ Verification error. Please try again." }));
    } finally {
      setLoadingQuestion(null);
    }
  };

  // Reset progress for this team (fresh & clean for testing or re-verification)
  const handleResetTeamAnswers = async () => {
    if (!confirm(`Reset all verified answers for team "${teamName}"? All questions will be reset fresh.`)) {
      return;
    }

    setIsResetting(true);
    try {
      await fetch("/api/checkpoint", { method: "DELETE" });

      // Clear local states
      setClearedQuestions({});
      setUnlockedChars({});
      setAnswers({});
      setQuestionStatus({});
      setFeedback({});

      // Clear team-scoped storage
      try {
        sessionStorage.removeItem(clearedKey);
        sessionStorage.removeItem(charsKey);
        sessionStorage.removeItem(answersKey);
      } catch {}

      setResetMsg(`✓ All question answers reset fresh for team ${teamName}. You can now start fresh!`);

      // Refresh leaderboard to reflect reset
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("leaderboard-update"));
      }
    } catch {
      setResetMsg("Failed to reset question progress. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleInputChange = (qId: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: val };
      try {
        sessionStorage.setItem(answersKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Reset red error state when typing
    if (questionStatus[qId] === "wrong") {
      setQuestionStatus((prev) => ({ ...prev, [qId]: "idle" }));
      setFeedback((prev) => ({ ...prev, [qId]: "" }));
    }
  };

  // Re-open a question if the user wants to re-type or test
  const handleReattempt = (qId: string) => {
    setClearedQuestions((prev) => {
      const next = { ...prev, [qId]: false };
      try {
        sessionStorage.setItem(clearedKey, JSON.stringify(next));
      } catch {}
      return next;
    });
    setQuestionStatus((prev) => ({ ...prev, [qId]: "idle" }));
    setFeedback((prev) => ({ ...prev, [qId]: "" }));
  };

  // Build the 10-char preview string from all 10 questions
  const assembledCode = questions
    .map((q) => unlockedChars[q.id] || "_")
    .join(" ");

  const solvedCount = Object.keys(clearedQuestions).filter((k) => clearedQuestions[k]).length;

  return (
    <div className="space-y-6">
      {/* Top Progress Tracker */}
      <div className="p-4 bg-paper border-2 border-ink rounded shadow-hard-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black uppercase text-crimson tracking-wider">
              TEAM: {teamName} ({teamId})
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-ink/40 rounded text-muted font-bold">
              PROGRESS: {solvedCount} / {questions.length} QUESTIONS SOLVED
            </span>
          </div>
          <p className="font-mono text-xs text-muted">
            Submit answers below to verify and assemble your 10-character Mystery Box code. Answers are private to your team.
          </p>
        </div>

        {/* Action Controls & Code Assembly */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Live Code Assembly Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cream border-2 border-ink rounded font-mono text-xs font-black tracking-widest text-ink shadow-inner">
            <span className="text-muted text-[10px] uppercase">CODE:</span>
            <span className="text-crimson font-black text-sm tracking-[0.2em]">
              {assembledCode}
            </span>
          </div>

          {/* Reset Verified Answers Button */}
          <button
            onClick={handleResetTeamAnswers}
            disabled={isResetting}
            title="Reset verified answers for this team to test fresh"
            className="px-3 py-1.5 bg-cream hover:bg-rose-100 border-2 border-ink hover:border-rose-700 text-ink hover:text-rose-800 rounded font-mono text-xs font-bold uppercase tracking-wider shadow-hard-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <span>↺</span>
            <span>{isResetting ? "RESETTING..." : "RESET ANSWERS"}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Banner */}
      {resetMsg && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded font-mono text-xs font-bold text-emerald-900 shadow-sm flex items-center justify-between">
          <span>{resetMsg}</span>
          <button
            onClick={() => setResetMsg(null)}
            className="text-emerald-800 hover:text-emerald-950 font-black text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 10 Question Cards */}
      <div className="space-y-5">
        {questions.map((q) => {
          const isCleared = clearedQuestions[q.id];
          const status = questionStatus[q.id] || (isCleared ? "correct" : "idle");
          const isWrong = status === "wrong";
          const isCorrect = status === "correct" || isCleared;

          return (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              className={`p-4 sm:p-5 border-2 rounded shadow-hard-sm space-y-3.5 transition-all duration-200 ${
                isCorrect
                  ? "bg-emerald-50/60 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : isWrong
                  ? "bg-rose-50/50 border-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  : "bg-cream/60 border-ink hover:border-crimson"
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full font-mono text-xs font-black flex items-center justify-center border shadow-sm ${
                      isCorrect
                        ? "bg-emerald-600 text-white border-emerald-800"
                        : isWrong
                        ? "bg-rose-600 text-white border-rose-800"
                        : "bg-crimson text-paper border-ink"
                    }`}
                  >
                    {q.step}
                  </span>
                  <h3
                    className={`font-display text-base sm:text-lg uppercase font-black tracking-tight ${
                      isCorrect
                        ? "text-emerald-800"
                        : isWrong
                        ? "text-rose-800"
                        : "text-crimson"
                    }`}
                  >
                    {q.title}
                  </h3>
                </div>
              </div>

              {/* Question Text */}
              <p className="font-mono text-xs sm:text-sm text-ink leading-relaxed pt-1">
                {q.text}
              </p>

              {/* Clue Derivation Rule */}
              <div className="text-xs font-mono text-crimson-dark bg-paper/80 p-2 border border-ink/20 rounded">
                <span className="font-bold uppercase tracking-wider text-ink">Clue Derivation:</span>{" "}
                {q.derivation}
              </div>

              {/* Interactive Answer Checker (Shows Green for Correct, Red for Wrong) */}
              <div className="pt-2 border-t border-ink/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {isCorrect ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Green Success Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white font-mono text-xs font-black rounded border-2 border-emerald-800 shadow-sm uppercase tracking-wider">
                      <span>✓ CORRECT ANSWER — VERIFIED</span>
                    </div>

                    {unlockedChars[q.id] && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-paper border-2 border-emerald-600 rounded font-mono text-xs font-black text-emerald-800 shadow-sm">
                        <span>UNLOCKED CHAR:</span>
                        <span className="text-sm font-black px-1.5 py-0.2 bg-emerald-100 rounded text-emerald-900 border border-emerald-300">
                          {unlockedChars[q.id]}
                        </span>
                      </div>
                    )}

                    {/* Button to re-attempt or edit if needed */}
                    <button
                      onClick={() => handleReattempt(q.id)}
                      className="text-[10px] font-mono font-bold text-ink hover:text-crimson underline underline-offset-2 ml-2"
                      title="Re-open input to test or change"
                    >
                      Re-verify / Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Enter derived answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCheckAnswer(q.id);
                        }
                      }}
                      className={`px-3 py-1.5 font-mono text-xs uppercase w-full sm:w-64 rounded border-2 transition-all duration-150 focus:outline-none ${
                        isWrong
                          ? "bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-400"
                          : "bg-paper border-ink text-ink focus:ring-2 focus:ring-brass"
                      }`}
                    />
                    <Button
                      size="sm"
                      variant={isWrong ? "danger" : "primary"}
                      isLoading={loadingQuestion === q.id}
                      onClick={() => handleCheckAnswer(q.id)}
                    >
                      {isWrong ? "RE-CHECK" : "CHECK ANSWER"}
                    </Button>
                  </div>
                )}

                {/* Status Feedback (Green or Red) */}
                {feedback[q.id] && (
                  <div
                    className={`font-mono text-xs font-bold px-3 py-1 rounded border flex items-center gap-1.5 ${
                      isCorrect
                        ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                        : "bg-rose-100 border-rose-400 text-rose-700 animate-shake"
                    }`}
                  >
                    <span>{feedback[q.id]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionList;
