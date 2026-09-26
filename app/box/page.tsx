"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { MysteryChest, ChestState } from "@/components/box/MysteryChest";
import { CodeInput } from "@/components/box/CodeInput";
import { ResultBanner, ResultBannerData } from "@/components/box/ResultBanner";
import { Confetti } from "@/components/box/Confetti";
import { soundManager } from "@/components/sound/SoundManager";

interface EventStatusResponse {
  serverNow: string;
  status: "not_started" | "live" | "ended" | "paused";
  remainingSeconds: number;
  secondsUntilStart: number;
}

export default function BoxPage() {
  const router = useRouter();

  // Authentication & Event State
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [eventStatus, setEventStatus] = useState<EventStatusResponse | null>(null);

  // Input & Visual Chest State
  const [code, setCode] = useState("");
  const [chestState, setChestState] = useState<ChestState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Results & Banners
  const [bannerData, setBannerData] = useState<ResultBannerData>({ type: "idle" });

  // 1. Authenticate & load event status on mount
  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/enter?next=/box");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.team) setTeam(data.team);
      })
      .catch(() => {});

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setEventStatus(data);
        }
      } catch {
        // ignore
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  // 2. Submission Handler with Idempotency & 600ms consistent reveal
  const handleSubmit = useCallback(async () => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 5 || isSubmitting) return;

    setIsSubmitting(true);
    const minRevealTimer = new Promise((resolve) => setTimeout(resolve, 600));
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    try {
      const responsePromise = fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, requestId }),
      });

      const [res] = await Promise.all([responsePromise, minRevealTimer]);
      const data = await res.json();

      if (!res.ok) {
        soundManager.playLockClick();

        if (res.status === 429) {
          setChestState("locked-out");
          setBannerData({
            type: "cooldown",
            cooldownSeconds: data.error?.retryAfterSeconds || 30,
          });
        } else {
          setChestState("shake");
          setBannerData({
            type: "error",
            errorMessage: data.error?.message || "Submission rejected.",
          });
          setTimeout(() => setChestState("idle"), 800);
        }
        setIsSubmitting(false);
        return;
      }

      // Handle outcomes
      if (data.result === "correct") {
        soundManager.playChestCreak();
        setChestState("opening");

        setTimeout(() => {
          setChestState("open");
          soundManager.playVictoryChime();

          if (data.isFirst) {
            setShowConfetti(true);
            setBannerData({
              type: "correct_first",
              rank: 1,
              solvedAtFormatted: data.solvedAtFormatted,
            });
          } else {
            setBannerData({
              type: "correct_other",
              rank: data.rank,
              solvedAtFormatted: data.solvedAtFormatted,
            });
          }
        }, 900);
      } else if (data.result === "already_solved") {
        setChestState("open");
        setBannerData({
          type: "already_solved",
          rank: data.rank,
          solvedAtFormatted: data.solvedAtFormatted,
        });
      } else {
        // Incorrect Code
        soundManager.playLockClick();
        setChestState("shake");

        if (data.cooldownApplied) {
          setTimeout(() => setChestState("locked-out"), 400);
          setBannerData({
            type: "cooldown",
            cooldownSeconds: data.cooldownSeconds,
          });
        } else {
          setTimeout(() => setChestState("idle"), 600);
          setBannerData({
            type: "incorrect",
            attemptsBeforeCooldown: data.attemptsBeforeCooldown,
          });
        }
      }
    } catch {
      soundManager.playLockClick();
      setChestState("shake");
      setBannerData({
        type: "error",
        errorMessage: "THE LINE WENT DEAD. CHECK YOUR CONNECTION AND TRY AGAIN.",
      });
      setTimeout(() => setChestState("idle"), 600);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, isSubmitting]);

  const handleCooldownFinish = () => {
    setChestState("idle");
    setBannerData({ type: "idle" });
  };

  const isLive = eventStatus?.status === "live";
  const isInputDisabled =
    !isLive ||
    isSubmitting ||
    chestState === "open" ||
    chestState === "opening" ||
    chestState === "locked-out";

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto py-2 space-y-6">
      {/* Confetti Explosion for 1st solver */}
      {showConfetti && <Confetti durationMs={4500} />}

      {/* Header & Status Banner */}
      <div className="w-full text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-5xl uppercase text-crimson font-black tracking-tight drop-shadow-[2px_2px_0_var(--cyan-shadow)]">
          THE MYSTERY BOX
        </h1>
        {team && (
          <p className="font-mono text-xs sm:text-sm text-ink uppercase tracking-wider">
            Station Active: <span className="font-black text-crimson">{team.name}</span>
          </p>
        )}

        {eventStatus && (
          <StatusBanner
            status={eventStatus.status}
            remainingSeconds={eventStatus.remainingSeconds}
            secondsUntilStart={eventStatus.secondsUntilStart}
          />
        )}
      </div>

      {/* Centerpiece: Interactive Vector Mystery Chest */}
      <div className="py-2">
        <MysteryChest state={chestState} />
      </div>

      {/* Dynamic Result / Cooldown / Victory Banner */}
      <ResultBanner data={bannerData} onCooldownFinish={handleCooldownFinish} />

      {/* 5-Box Discrete Code Input */}
      {chestState !== "open" && (
        <Panel className="w-full max-w-md flex flex-col items-center space-y-5 bg-paper">
          <div className="text-center">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-muted block">
              ENTER 5-CHARACTER ACCESS KEY
            </span>
            <span className="font-mono text-[11px] text-muted block">
              (Derived from Questions Q1 through Q5)
            </span>
          </div>

          <CodeInput
            value={code}
            onChange={(val) => setCode(val)}
            disabled={isInputDisabled}
            hasError={bannerData.type === "incorrect"}
            onEnterSubmit={handleSubmit}
          />

          <div className="w-full pt-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isInputDisabled || code.length !== 5}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              TRY THE CODE
            </Button>
          </div>
        </Panel>
      )}

      {/* Persistent Note */}
      <div className="font-mono text-xs text-muted text-center max-w-md leading-relaxed">
        Attempts are monitored and rate-limited. 3 consecutive failed attempts trigger escalating security cooldowns.
      </div>
    </div>
  );
}
